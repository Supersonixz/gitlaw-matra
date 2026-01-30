
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
    type?: string;
    similarity?: number;
    pageNumber?: number;
    ai_summary?: string;
    key_change?: string;
    diff_versions?: {
        ai_ocr?: string;
        legacy_json?: string;
    };
}

// --- Rich Data Interfaces (match JSON structure from Backend) ---
export interface RichSection {
    id: string;
    content: string;
    type: string;
    status: string;
    similarity: number;
    category_id: string;
    diff_versions?: {
        ai_ocr: string;
        legacy_json: string;
    };
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
    pages: PageRatio[][];
}

export interface ConstitutionContent {
    id: string;
    name: string;
    sections: SectionContent[];
    richData?: RichCategory[];
}

export const CONSTITUTIONS: Constitution[] = [
    { id: 'con2475temp', year: 2475, name: 'พระราชบัญญัติธรรมนูญการปกครองแผ่นดินสยามชั่วคราว ๒๔๗๕' },
    { id: 'con2475', year: 2475, name: 'รัฐธรรมนูญแห่งราชอาณาจักรสยาม ๒๔๗๕' },
    { id: 'con2489', year: 2489, name: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย ๒๔๘๙' },
    { id: 'con2490temp', year: 2490, name: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย (ฉบับชั่วคราว) ๒๔๙๐' },
    { id: 'con2492', year: 2492, name: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย ๒๔๙๒' },
    { id: 'con2495', year: 2495, name: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย ๒๔๗๕ แก้ไขเพิ่มเติม ๒๔๙๕' },
    { id: 'con2502temp', year: 2502, name: 'ธรรมนูญการปกครองราชอาณาจักร ๒๕๐๒' },
    { id: 'con2511', year: 2511, name: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย ๒๕๑๑' },
    { id: 'con2515temp', year: 2515, name: 'ธรรมนูญการปกครองราชอาณาจักร ๒๕๑๕' },
    { id: 'con2517', year: 2517, name: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย ๒๕๑๗' },
    { id: 'con2519temp', year: 2519, name: 'ธรรมนูญการปกครองราชอาณาจักร ๒๕๑๙' },
    { id: 'con2520temp', year: 2520, name: 'ธรรมนูญการปกครองราชอาณาจักร ๒๕๒๐' },
    { id: 'con2521', year: 2521, name: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย ๒๕๒๑' },
    { id: 'con2534temp', year: 2534, name: 'ธรรมนูญการปกครองราชอาณาจักร ๒๕๓๔' },
    { id: 'con2534', year: 2534, name: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย ๒๕๓๔' },
    { id: 'con2540', year: 2540, name: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย ๒๕๔๐' },
    { id: 'con2549temp', year: 2549, name: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย (ฉบับชั่วคราว) ๒๕๔๙' },
    { id: 'con2550', year: 2550, name: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย ๒๕๕๐' },
    { id: 'con2557temp', year: 2557, name: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย (ฉบับชั่วคราว) ๒๕๕๗' },
    { id: 'con2560', year: 2560, name: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย ๒๕๖๐' },
];

// Helper: แปลง Rich JSON เป็น Flat List
const transformRichData = (richData: RichCategory[], id: string, name: string) => {
    const flatSections: SectionContent[] = [];
    const pageMapping: number[] = PDF_PAGE_MAPPING[id] || [];

    if (Array.isArray(richData)) {
        richData.forEach((cat: RichCategory) => {
            if (cat.sections) {
                cat.sections.forEach((sec: RichSection) => {
                    const numericPart = sec.id.match(/\d+/);
                    const secId = numericPart ? parseInt(numericPart[0]) : 0;

                    let pageNum = 1;
                    if (secId > 0 && pageMapping.length > 0) {
                        const foundIndex = pageMapping.findIndex(lastSec => secId <= lastSec);
                        if (foundIndex !== -1) {
                            pageNum = foundIndex + 1;
                        } else {
                            pageNum = pageMapping.length + 1;
                        }
                    }

                    flatSections.push({
                        id: sec.id,
                        content: sec.content,
                        chapter_name: cat.category_name,
                        category_id: cat.category_id,
                        status: sec.status,
                        type: sec.type,
                        similarity: sec.similarity,
                        diff_versions: sec.diff_versions,
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

// Return type with meta and content separated, to allow easier partial loading if needed
export interface ConstitutionData {
    meta: ConstitutionMeta;
    content: ConstitutionContent;
    categories: CategoryOverview[];
}

export const fetchConstitutionData = async (id: string): Promise<ConstitutionData> => {
    // 1. Find config
    const config = CONSTITUTIONS.find(c => c.id === id);
    const name = config ? config.name : "Unknown";
    const year = config ? config.year : 0;

    let richData: RichCategory[] = [];

    // 2. Select Rich Data with Dynamic Import
    try {
        switch (id) {
            case 'con2475temp': richData = (await import('@/backend/json_output/final/con2475temp_full_summary.json')).default as RichCategory[]; break;
            case 'con2475': richData = (await import('@/backend/json_output/final/con2475_full_summary.json')).default as RichCategory[]; break;
            case 'con2489': richData = (await import('@/backend/json_output/final/con2489_full_summary.json')).default as RichCategory[]; break;
            case 'con2490temp': richData = (await import('@/backend/json_output/final/con2490temp_full_summary.json')).default as RichCategory[]; break;
            case 'con2492': richData = (await import('@/backend/json_output/final/con2492_full_summary.json')).default as RichCategory[]; break;
            case 'con2495': richData = (await import('@/backend/json_output/final/con2495_full_summary.json')).default as RichCategory[]; break;
            case 'con2502temp': richData = (await import('@/backend/json_output/final/con2502temp_full_summary.json')).default as RichCategory[]; break;
            case 'con2511': richData = (await import('@/backend/json_output/final/con2511_full_summary.json')).default as RichCategory[]; break;
            case 'con2515temp': richData = (await import('@/backend/json_output/final/con2515temp_full_summary.json')).default as RichCategory[]; break;
            case 'con2517': richData = (await import('@/backend/json_output/final/con2517_full_summary.json')).default as RichCategory[]; break;
            case 'con2519temp': richData = (await import('@/backend/json_output/final/con2519temp_full_summary.json')).default as RichCategory[]; break;
            case 'con2520temp': richData = (await import('@/backend/json_output/final/con2520temp_full_summary.json')).default as RichCategory[]; break;
            case 'con2521': richData = (await import('@/backend/json_output/final/con2521_full_summary.json')).default as RichCategory[]; break;
            case 'con2534': richData = (await import('@/backend/json_output/final/con2534_full_summary.json')).default as RichCategory[]; break;
            case 'con2534temp': richData = (await import('@/backend/json_output/final/con2534temp_full_summary.json')).default as RichCategory[]; break;
            case 'con2540': richData = (await import('@/backend/json_output/final/con2540_full_summary.json')).default as RichCategory[]; break;
            case 'con2549temp': richData = (await import('@/backend/json_output/final/con2549temp_full_summary.json')).default as RichCategory[]; break;
            case 'con2550': richData = (await import('@/backend/json_output/final/con2550_full_summary.json')).default as RichCategory[]; break;
            case 'con2557temp': richData = (await import('@/backend/json_output/final/con2557temp_full_summary.json')).default as RichCategory[]; break;
            case 'con2560': richData = (await import('@/backend/json_output/final/con2560_full_summary.json')).default as RichCategory[]; break;
            default: richData = []; break;
        }
    } catch (e) {
        console.error(`Error loading constitution data for ${id}:`, e);
        richData = [];
    }

    const content = transformRichData(richData, id, name);

    // 3. เตรียม Categories สำหรับ DNA Bar
    let categories: CategoryOverview[] = [];
    if (content?.richData) {
        categories = content.richData.map((cat: RichCategory) => ({
            id: cat.category_id,
            title: cat.category_name,
            color: CATEGORY_COLORS[cat.category_id] || "#ccc"
        }));
    }

    // 4. คำนวณ Page Ratio (DNA Bar)
    const totalPages = PDF_TOTAL_PAGES[id] || 10;

    // Calculate total character count
    let totalLength = 0;
    const catLengths: Record<string, number> = {};

    content?.sections.forEach(sec => {
        if (sec.type === 'section' || !sec.type) {
            const len = sec.content.length;
            totalLength += len;

            const catId = sec.category_id || 'uncategorized';
            catLengths[catId] = (catLengths[catId] || 0) + len;
        }
    });

    //simple ratio
    const calculatedPages: PageRatio[][] = Array.from({ length: totalPages }, () => []);

    // Distribute ratios
    if (totalLength > 0) {
        Object.keys(catLengths).forEach(catId => {
            const ratio = (catLengths[catId] / totalLength) * totalPages;

            if (calculatedPages[0]) {
                calculatedPages[0].push({
                    categoryId: catId,
                    pageRatio: ratio
                });
            }
        });
    }

    const meta: ConstitutionMeta = {
        id,
        name,
        year: typeof year === 'string' ? parseInt(year) : year,
        pageCount: totalPages,
        pages: calculatedPages
    };

    return { meta, content, categories };
};

// Deprecated: kept for compatibility if needed, but should upgrade to async
export const getConstitutionData = (id: string) => {
    // This function can no longer be synchronous if we want dynamic imports. 
    // We'll throw an error to force upgrade.
    throw new Error("getConstitutionData is deprecated. Use fetchConstitutionData instead.");
};

export const getAllConstitutions = () => {
    return CONSTITUTIONS;
};