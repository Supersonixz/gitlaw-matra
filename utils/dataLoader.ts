// src/utils/dataLoader.ts

import overviewRaw from '@/data/constitution-overview.json';
import contentRaw from '@/data/constitutions.json';

// 🔥 IMPORT ไฟล์ใหม่ 2 ไฟล์ (ตรวจสอบ path ให้ตรงกับที่คุณวางไฟล์)
import rich2475Perm from '@/data/con2475_full_summary.json';
// สมมติว่าคุณเจนไฟล์ temp แล้ว (ถ้ายัง ให้ใช้ไฟล์ Perm แก้ขัดไปก่อนได้)
import rich2475Temp from '@/data/con2475temp_full_summary.json';

import { CATEGORY_COLORS } from '@/utils/categoryColors';

// --- Type Definitions ---
export interface CategoryOverview {
    id: string;
    title: string;
    color: string;
}

export interface ConstitutionMeta {
    pageCount: number;
    id: string;
    name: string;
    year: number;
    pages: any[][];
}

export interface SectionContent {
    id: string;
    content: string;
    chapter_name: string;
    category_id?: string; // เพิ่ม optional
    status?: string;     // เพิ่ม optional
    similarity?: number; // เพิ่ม optional
}

export interface ConstitutionContent {
    id: string;
    name: string;
    sections: SectionContent[];
    richData?: any[];
}

// Helper: แปลง Rich JSON เป็น Flat List
const transformRichData = (richData: any[], id: string, name: string) => {
    const flatSections: SectionContent[] = [];

    // ตรวจสอบว่า richData เป็น Array จริงไหม
    if (Array.isArray(richData)) {
        richData.forEach((cat: any) => {
            if (cat.sections) {
                cat.sections.forEach((sec: any) => {
                    flatSections.push({
                        id: sec.section_number,
                        content: sec.content,
                        chapter_name: cat.category_name,
                        category_id: cat.category_id,
                        status: sec.status,
                        similarity: sec.similarity
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
export interface Page {
    categoryId: string;
    pageRatio: number;
}

export const getConstitutionData = (id: string) => {
    // 1. หา Meta Data
    const meta = (overviewRaw.constitutions as any[]).find(c => c.id === id);

    // 2. Logic การโหลดเนื้อหา
    let content: ConstitutionContent | undefined;

    switch (id) {
        case 'con2475temp':
            // ถ้าคุณมีไฟล์ temp แยก ให้เปลี่ยน rich2475Perm เป็น rich2475Temp ตรงนี้
            content = transformRichData(rich2475Temp, id, "พระราชบัญญัติธรรมนูญฯ ๒๔๗๕ (ชั่วคราว)");
            break;

        case 'con2475':
            content = transformRichData(rich2475Perm, id, "รัฐธรรมนูญแห่งราชอาณาจักรสยาม ๒๔๗๕");
            break;

        default:
            // กรณีอื่นๆ (2540, 2560) โหลดแบบเก่า
            content = (contentRaw as unknown as ConstitutionContent[]).find(c => c.id === id);
            break;
    }

    // 3. เตรียม Categories สำหรับ DNA Bar
    // (พยายามใช้ข้อมูลจาก richData ถ้ามี เพื่อให้แม่นยำกว่า)
    let categories: CategoryOverview[] = [];

    if (content?.richData) {
        // สร้าง Category List จากข้อมูลจริงที่มี
        categories = content.richData.map((cat: any) => ({
            id: cat.category_id,
            title: cat.category_name, // ใช้ชื่อไทย
            color: CATEGORY_COLORS[cat.category_id] || "#ccc"
        }));
    } else {
        // Fallback ใช้ Meta Data เดิม
        categories = meta?.pages.flat().map((p: any) => ({
            id: p.categoryId,
            title: p.categoryId, // ตรงนี้อาจจะเป็นอังกฤษอยู่ ถ้าอยากได้ไทยต้องเขียน Map เพิ่ม
            color: CATEGORY_COLORS[p.categoryId] || "#ccc"
        })) || [];
    }

    return { meta, content, categories };
};

export const getAllConstitutions = () => {
    return overviewRaw.constitutions.map(c => ({ id: c.id, year: c.year, name: c.name }));
};

export const findPageForCategory = (meta: ConstitutionMeta, categoryId: string): number => {
    if (!meta || !meta.pages) return 1;
    // Find the first page that contains this category
    const pageIndex = meta.pages.findIndex(pageItems =>
        pageItems.some((item: any) => item.categoryId === categoryId)
    );
    return pageIndex === -1 ? 1 : pageIndex + 1; // 1-based index
};