export type DiffStatus = 'modified' | 'added' | 'deleted' | 'unchanged' | 'VERIFIED' | 'REVIEW_NEEDED' | 'OCR_ONLY';

export interface Section {
    section_number: string;
    content: string;
    // เพิ่มฟิลด์ใหม่ (Optional)
    status?: DiffStatus;
    similarity?: number;
}

// โครงสร้างข้อมูลแบบ Rich (ที่มี AI Summary)
export interface RichCategoryData {
    category_id: string;
    category_name: string;
    ai_summary: string;
    key_change: string;
    section_count: number;
    sections: Section[];
}
export interface CategoryData {
    constitution_year: number;
    category_id: string;
    category_name: string;
    ai_summary: string;
    key_change: string;
    section_count: number;
    sections: Section[];
    status?: DiffStatus;
}

// ลอก Config จาก Python มาเพื่อให้ลำดับหมวดหมู่ตรงกัน
export const CATEGORY_ORDER = [
    { id: "preamble", name: "คำปรารภ" },
    { id: "general", name: "บททั่วไป" },
    { id: "monarchy", name: "พระมหากษัตริย์" },
    { id: "rights_duties", name: "สิทธิเสรีภาพ" },
    { id: "state_policies", name: "แนวนโยบายแห่งรัฐ" },
    { id: "legislative", name: "นิติบัญญัติ (สภา)" },
    { id: "executive", name: "บริหาร (ครม.)" },
    { id: "judicial", name: "ตุลาการ (ศาล)" },
    { id: "independent_orgs", name: "องค์กรอิสระ" },
    { id: "local_admin", name: "ปกครองส่วนท้องถิ่น" },
    { id: "amendment", name: "การแก้ไขรัฐธรรมนูญ" },
    { id: "transitory", name: "บทเฉพาะกาล" },
];