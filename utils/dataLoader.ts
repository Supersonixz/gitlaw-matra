// src/utils/dataLoader.ts
// 🔥 IMPORT ไฟล์ใหม่
import rich2475Perm from '@/backend/json_output/final/con2475_full_summary.json';
import rich2475Temp from '@/backend/json_output/final/con2475temp_full_summary.json';
import rich2489Perm from '@/backend/json_output/final/con2489_full_summary.json';

import { CATEGORY_COLORS } from '@/utils/categoryColors';
import { PDF_PAGE_MAPPING, PDF_TOTAL_PAGES } from '@/mapping/pdfPageMapping';

// --- Type Definitions ---
export interface CategoryOverview {
    id: string;
    title: string;
    color: string;
}

export interface SectionContent {
    id: string;
    content: string;
    chapter_name: string;
    category_id?: string;
    status?: string;
    similarity?: number;
    pageNumber?: number; // ✅ เพิ่ม Page Number
    ai_summary?: string;
    key_change?: string;
}

// --- Rich Data Interfaces (match JSON structure) ---
export interface RichSection {
    section_number: string;
    content: string;
    category_id: string;
    status: string;
    similarity: number;
}

export interface RichCategory {
    constitution_year: number;
    category_id: string;
    category_name: string;
    ai_summary: string;
    key_change: string;
    section_count: number;
    sections: RichSection[];
}

export interface PageRatio {
    categoryId: string;
    pageRatio: number;
}

export interface Constitution {
    id: string;
    year: number | string;
    name: string;
}

export interface ConstitutionMeta {
    pageCount: number;
    id: string;
    name: string;
    year: number;
    pages: PageRatio[][]; // Updated to strict type
}

export interface ConstitutionContent {
    id: string;
    name: string;
    sections: SectionContent[];
    richData?: RichCategory[];
}

// Helper: แปลง Rich JSON เป็น Flat List
const transformRichData = (richData: RichCategory[], id: string, name: string) => {
    const flatSections: SectionContent[] = [];
    // Mapping format: Array of last section numbers per page.
    // Index 0 = Page 1, Index 1 = Page 2, etc.
    const pageMapping: number[] = PDF_PAGE_MAPPING[id] || [];

    if (Array.isArray(richData)) {
        richData.forEach((cat: RichCategory) => {
            if (cat.sections) {
                cat.sections.forEach((sec: RichSection) => {
                    const secId = parseInt(sec.section_number);

                    // Logic: Find the first page where this section is <= the page's last section
                    let pageNum = 1;
                    if (!isNaN(secId) && pageMapping.length > 0) {
                        const foundIndex = pageMapping.findIndex(lastSec => secId <= lastSec);
                        if (foundIndex !== -1) {
                            pageNum = foundIndex + 1; // 0-based index -> 1-based page
                        } else {
                            // If greater than the last mapped section, assume it's on the next page(s)
                            // or just default to the last known page + 1 (or allow it to overflow)
                            pageNum = pageMapping.length + 1;
                        }
                    }

                    flatSections.push({
                        id: sec.section_number,
                        content: sec.content,
                        chapter_name: cat.category_name,
                        category_id: cat.category_id,
                        status: sec.status,
                        similarity: sec.similarity,
                        pageNumber: pageNum,
                        ai_summary: cat.ai_summary,
                        key_change: cat.key_change
                    });
                });
            }
        });
    }

    return {
        id,
        name,
        sections: flatSections,
        richData: richData
    };
};

export const getConstitutionData = (id: string) => {
    let content: ConstitutionContent | undefined;
    let year = 0;
    let name = "";

    switch (id) {
        case 'con2475temp':
            name = "พระราชบัญญัติธรรมนูญฯ ๒๔๗๕ (ชั่วคราว)";
            year = 2475;
            content = transformRichData(rich2475Temp, id, name);
            break;

        case 'con2475':
            name = "รัฐธรรมนูญแห่งราชอาณาจักรสยาม ๒๔๗๕";
            year = 2475;
            content = transformRichData(rich2475Perm, id, name);
            break;

        case 'con2489':
            name = "รัฐธรรมนูญแห่งราชอาณาจักรไทย ๒๔๘๙";
            year = 2489;
            content = transformRichData(rich2489Perm, id, name);
            break;

        default:
            name = "Unknown";
            content = transformRichData([], id, name);
            break;
    }

    // 3. เตรียม Categories สำหรับ DNA Bar
    let categories: CategoryOverview[] = [];
    if (content?.richData) {
        categories = content.richData.map((cat: RichCategory) => ({
            id: cat.category_id,
            title: cat.category_name,
            color: CATEGORY_COLORS[cat.category_id] || "#ccc"
        }));
    }

    // คำนวณ Ratio ตามความยาวตัวอักษรจริง
    const totalPages = PDF_TOTAL_PAGES[id] || 10;

    // Calculate total character count
    let totalLength = 0;
    const catLengths: Record<string, number> = {};

    content?.sections.forEach(sec => {
        const len = sec.content.length;
        totalLength += len;

        const catId = sec.category_id || 'uncategorized';
        catLengths[catId] = (catLengths[catId] || 0) + len;
    });

    //simple ratio
    const calculatedPages: PageRatio[][] = Array.from({ length: totalPages }, () => []);

    // Distribute ratios
    if (totalLength > 0) {
        Object.keys(catLengths).forEach(catId => {
            const ratio = (catLengths[catId] / totalLength) * totalPages;
            calculatedPages[0].push({
                categoryId: catId,
                pageRatio: ratio
            });
        });
    }

    const meta: ConstitutionMeta = {
        id,
        name,
        year,
        pageCount: totalPages,
        pages: calculatedPages
    };

    return { meta, content, categories };
};

export const getAllConstitutions = () => {
    return [
        { id: 'con2475temp', year: 2475, name: 'ธรรมนูญการปกครองแผ่นดินสยามชั่วคราว' },
        { id: 'con2475', year: 2475, name: 'รัฐธรรมนูญแห่งราชอาณาจักรสยาม' },
        { id: 'con2489', year: 2489, name: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย 2489' },
    ];
};