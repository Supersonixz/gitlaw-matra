import { SectionContent } from "./dataLoader";
import stringSimilarity from 'string-similarity';
import { CATEGORY_ORDER } from "@/types";

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
    leftAiSummary?: string;
    rightAiSummary?: string;
    leftKeyChange?: string;
    rightKeyChange?: string;
}

// --- Alignment Logic ---
export const alignSections = (leftSections: SectionContent[], rightSections: SectionContent[]): DiffRow[] => {

    // 1. Group by Category (Now using Chapter Name as primary grouper)
    const categories = new Set([
        ...leftSections.map(s => s.chapter_name?.trim() || 'General'),
        ...rightSections.map(s => s.chapter_name?.trim() || 'General')
    ]);

    const resultRows: DiffRow[] = [];
    const THRESHOLD = 0.55; // Increase threshold to avoid matching "boilerplate" (King has power...)

    // Process each category independently
    categories.forEach(catName => {
        // Safe check
        const cName = catName || 'General';

        // Filter by chapter_name
        const leftPool = leftSections.filter(s => (s.chapter_name?.trim() || 'General') === cName);
        const rightPool = rightSections.filter(s => (s.chapter_name?.trim() || 'General') === cName);

        // Get Metadata (Title, Summary) from first available item
        const metaSource = leftPool[0] || rightPool[0];

        // Normalize Category ID using Chapter Name (Title)
        let cId = metaSource?.category_id || 'unknown_cat';
        const categoryTitle = cName;

        // Find best matching canonical category
        let bestMatch: { id: string, score: number } | null = null;

        for (const c of CATEGORY_ORDER) {
            // Direct include check (fast & accurate for substrings)
            if (categoryTitle.includes(c.name) || c.name.includes(categoryTitle)) {
                if (!bestMatch || bestMatch.score < 1.0) {
                    bestMatch = { id: c.id, score: 1.0 };
                }
            } else {
                // Fuzzy check
                const score = stringSimilarity.compareTwoStrings(categoryTitle, c.name);
                if (score > 0.4 && (!bestMatch || score > bestMatch.score)) {
                    bestMatch = { id: c.id, score };
                }
            }
        }

        if (bestMatch) {
            cId = bestMatch.id;
        }

        // Individual Summaries
        const leftMeta = leftPool[0];
        const rightMeta = rightPool[0];

        const leftAiSummary = leftMeta?.ai_summary;
        const rightAiSummary = rightMeta?.ai_summary;
        const leftKeyChange = leftMeta?.key_change;
        const rightKeyChange = rightMeta?.key_change;

        // Legacy/Fallback (prefer Right for display if single slot, as per request to see "new" context)
        // OR keep Left as default if we want Reference. 
        // User asked for "Right is main" or "Both". 
        // Let's populate the legacy fields with Right ?? Left to satisfy "Right is main" if UI uses legacy field.
        const aiSummary = rightAiSummary || leftAiSummary;
        const keyChange = rightKeyChange || leftKeyChange;

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
                    keyChange,
                    leftAiSummary,
                    rightAiSummary,
                    leftKeyChange,
                    rightKeyChange
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
                    keyChange,
                    leftAiSummary,
                    rightAiSummary,
                    leftKeyChange,
                    rightKeyChange
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
                    keyChange,
                    leftAiSummary,
                    rightAiSummary,
                    leftKeyChange,
                    rightKeyChange
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



    // --- Step 2: Global Fallback for Orphans (Cross-Chapter) ---
    // Fix: If chapters are renamed, content won't match in Step 1.
    // We try to match remaining REMOVE vs ADD across the entire document.

    const orphansL = resultRows.filter(r => r.status === 'REMOVE');
    const orphansR = resultRows.filter(r => r.status === 'ADD');
    const stableRows = resultRows.filter(r => r.status !== 'REMOVE' && r.status !== 'ADD');

    const matchedOrphans: DiffRow[] = [];
    const usedL = new Set<string>();
    const usedR = new Set<string>();

    const potentialMatches: { lRow: DiffRow, rRow: DiffRow, score: number }[] = [];

    // Brute-force compare all orphans (usually manageable size)
    const complexity = orphansL.length * orphansR.length;

    if (complexity > 2000) {
        // High complexity: Use Exact Match Optimization (O(N) with Map)
        const rightMap = new Map<string, DiffRow>();
        orphansR.forEach(r => {
            if (r.right) rightMap.set(r.right.content.trim(), r);
        });

        orphansL.forEach(lRow => {
            if (lRow.left) {
                const content = lRow.left.content.trim();
                if (rightMap.has(content)) {
                    const rRow = rightMap.get(content)!;
                    potentialMatches.push({ lRow, rRow, score: 1.0 });
                }
            }
        });
    } else {
        // Low complexity: Use Fuzzy Matching (O(N*M))
        orphansL.forEach(lRow => {
            orphansR.forEach(rRow => {
                if (lRow.left && rRow.right) {
                    const score = stringSimilarity.compareTwoStrings(lRow.left.content, rRow.right.content);
                    if (score > THRESHOLD) {
                        potentialMatches.push({ lRow, rRow, score });
                    }
                }
            });
        });
    }

    // Best matches first
    potentialMatches.sort((a, b) => b.score - a.score);

    potentialMatches.forEach(m => {
        if (!usedL.has(m.lRow.key) && !usedR.has(m.rRow.key)) {
            // Create Merged Row
            // Use Right's category info to show where it "Moved To" (target context)
            const mergedRow: DiffRow = {
                key: `cross::${m.lRow.sectionId}::${m.rRow.sectionId}`,
                sectionId: m.lRow.sectionId, // Keep original ID reference? Or use Right? Using Left's ID is common for "Modified", but Right's category.
                categoryId: m.rRow.categoryId,
                categoryTitle: m.rRow.categoryTitle,
                left: m.lRow.left,
                right: m.rRow.right,
                status: m.score > 0.85 ? 'MATCH' : 'MODIFIED',

                // Merge context from both
                leftAiSummary: m.lRow.leftAiSummary,
                rightAiSummary: m.rRow.rightAiSummary,
                leftKeyChange: m.lRow.leftKeyChange,
                rightKeyChange: m.rRow.rightKeyChange,

                // Fallback for UI
                aiSummary: m.rRow.rightAiSummary || m.lRow.leftAiSummary,
                keyChange: m.rRow.rightKeyChange || m.lRow.leftKeyChange,
            };

            matchedOrphans.push(mergedRow);
            usedL.add(m.lRow.key);
            usedR.add(m.rRow.key);
        }
    });

    // Filter out orphans that are now matched
    const finalOrphansL = orphansL.filter(r => !usedL.has(r.key));
    const finalOrphansR = orphansR.filter(r => !usedR.has(r.key));

    // Combine all rows
    // Note: sorting might be less perfect now, but grouping by category will still hold in UI.
    const finalResult = [...stableRows, ...matchedOrphans, ...finalOrphansL, ...finalOrphansR];

    // Optional: Sort to keep some order? 
    // DiffViewer groups by CategoryTitle, then iterates. 
    // It's better if items within a category are sorted by ID.
    // Let's rely on DiffViewer's grouping map Order? 
    // Actually DiffViewer creates groups based on *encounter order* in the list.
    // So we should try to keep `finalResult` somewhat sorted.
    // Simple sort: Category Title, then ID (numeric if possible)
    finalResult.sort((a, b) => {
        if (a.categoryTitle !== b.categoryTitle) {
            // Try to preserve original category order from input? Hard to know here.
            // Just string compare for stability, or no sort to preserve 'stableRows' order which followed input.
            // But 'matchedOrphans' are appended at end.
            return 0;
        }
        // Same category: sort by ID
        const getVal = (row: DiffRow) => {
            if (row.left) return parseFloat(row.left.id) || 9999;
            if (row.right) return parseFloat(row.right.id) || 9999;
            return 9999;
        };
        return getVal(a) - getVal(b);
    });

    return finalResult;
};
