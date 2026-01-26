import { SectionContent } from "./dataLoader";
import stringSimilarity from 'string-similarity';

export interface DiffRow {
    key: string;
    sectionId: string;
    categoryId: string;
    categoryTitle: string;
    left?: SectionContent;
    right?: SectionContent;
    status: 'MATCH' | 'MODIFIED' | 'ADD' | 'REMOVE';
    aiSummary?: string;
    keyChange?: string;
}

// --- Alignment Logic ---
export const alignSections = (leftSections: SectionContent[], rightSections: SectionContent[]): DiffRow[] => {

    // 1. Group by Category
    const categories = new Set([...leftSections.map(s => s.category_id), ...rightSections.map(s => s.category_id)]);
    const resultRows: DiffRow[] = [];
    const THRESHOLD = 0.55; // Increase threshold to avoid matching "boilerplate" (King has power...)

    // Process each category independently
    categories.forEach(catId => {
        // Safe check for undefined category
        const cId = catId || 'general';

        const leftPool = leftSections.filter(s => (s.category_id || 'general') === cId);
        const rightPool = rightSections.filter(s => (s.category_id || 'general') === cId);

        // Get Metadata (Title, Summary) from first available item
        const metaSource = leftPool[0] || rightPool[0];
        const categoryTitle = metaSource?.chapter_name || 'Unknown';
        const aiSummary = metaSource?.ai_summary;
        const keyChange = metaSource?.key_change;

        // Similarity Matrix: [LeftIndex, RightIndex, Score]
        const matches: { l: number, r: number, score: number }[] = [];

        leftPool.forEach((l, lIdx) => {
            rightPool.forEach((r, rIdx) => {
                // Use the library to compare text
                const score = stringSimilarity.compareTwoStrings(l.content, r.content);
                if (score > THRESHOLD) {
                    matches.push({ l: lIdx, r: rIdx, score });
                }
            });
        });

        // Sort matches by Score descending
        matches.sort((a, b) => b.score - a.score);

        const usedLeft = new Set<number>();
        const usedRight = new Set<number>();
        const categoryRows: DiffRow[] = [];

        // Greedy Matching
        matches.forEach(m => {
            if (!usedLeft.has(m.l) && !usedRight.has(m.r)) {
                // Determine Status based on Score
                // If extremely high score (e.g. > 0.85), it's a MATCH.
                // If reasonably high (0.35 - 0.85), it's MODIFIED.
                const status = m.score > 0.85 ? 'MATCH' : 'MODIFIED';

                categoryRows.push({
                    key: `${cId}::${leftPool[m.l].id}::${rightPool[m.r].id}`,
                    sectionId: `${leftPool[m.l].id}`,
                    categoryId: cId,
                    categoryTitle,
                    left: leftPool[m.l],
                    right: rightPool[m.r],
                    status: status,
                    aiSummary,
                    keyChange
                });
                usedLeft.add(m.l);
                usedRight.add(m.r);
            }
        });

        // Handle Unmatched Left (REMOVE)
        leftPool.forEach((l, idx) => {
            if (!usedLeft.has(idx)) {
                categoryRows.push({
                    key: `${cId}::${l.id}::REMOVE`,
                    sectionId: l.id,
                    categoryId: cId,
                    categoryTitle,
                    left: l,
                    right: undefined,
                    status: 'REMOVE',
                    aiSummary,
                    keyChange
                });
            }
        });

        // Handle Unmatched Right (ADD)
        rightPool.forEach((r, idx) => {
            if (!usedRight.has(idx)) {
                categoryRows.push({
                    key: `${cId}::ADD::${r.id}`,
                    sectionId: r.id,
                    categoryId: cId,
                    categoryTitle,
                    left: undefined,
                    right: r,
                    status: 'ADD',
                    aiSummary,
                    keyChange
                });
            }
        });

        // Sort Category Rows for Readability
        // Primary Sort: Left ID (Numeric)
        // If Left is missing (ADD row), insert it based on its Right ID relative to the flow
        categoryRows.sort((a, b) => {
            const getVal = (row: DiffRow) => {
                if (row.left) return parseFloat(row.left.id) || 9999;
                if (row.right) return parseFloat(row.right.id) || 9999;
                return 9999;
            };
            return getVal(a) - getVal(b);
        });

        resultRows.push(...categoryRows);
    });

    return resultRows;
};
