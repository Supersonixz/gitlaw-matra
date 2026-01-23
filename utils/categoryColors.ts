export const CATEGORY_COLORS: Record<string, string> = {
    // --- บทนำ & ทั่วไป ---
    preamble: "#718096",        // เทากลาง (Cool Gray)
    general: "#E53E3E",         // แดงเข้ม (ชาติ)

    // --- สถาบัน ---
    monarchy: "#D69E2E",        // ทองเข้ม (Yellow Gold) - อ่านง่ายกว่าเหลืองสด

    // --- ประชาชน & นโยบาย ---
    rights_duties: "#0BC5EA",   // ฟ้าสว่าง (Cyan) - สิทธิเสรีภาพ
    state_policies: "#38A169",  // เขียวใบไม้ (Green) - การพัฒนา/นโยบาย

    // --- การปฏิรูป & แก้ไข ---
    reform: "#9F7AEA",          // ม่วงอ่อน (Purple) - การเปลี่ยนแปลง
    amendment: "#ED64A6",       // ชมพู (Pink) - การแก้ไข

    // --- 3 อำนาจหลัก (ต้องแยกให้ชัด) ---
    legislative: "#DD6B20",     // ส้มเข้ม (Orange) - สภา/นิติบัญญัติ
    executive: "#3182CE",       // น้ำเงิน (Blue) - รัฐบาล/บริหาร
    judicial: "#1A365D",        // กรมท่า (Navy) - ศาล/ตุลาการ (เข้มสุด)

    // --- การตรวจสอบ & องค์กรอิสระ ---
    conflict_interest: "#F56565", // แดงอมส้ม (Red Alert) - การขัดกันของผลประโยชน์
    independent_orgs: "#319795",  // เขียวน้ำทะเล (Teal) - องค์กรอิสระ
    const_court: "#553C9A",       // ม่วงเข้ม (Deep Purple) - ศาล รธน.
    ethics: "#805AD5",            // ม่วงกลาง - จริยธรรม

    // --- การปกครอง ---
    local_admin: "#38B2AC",       // เขียวมิ้นท์ - ท้องถิ่น

    // --- อำนาจพิเศษ (โดดเด่นออกมาเลย) ---
    coup_power: "#2F4F4F",        // เขียวขี้ม้าเข้ม (Dark Slate Gray) - ทหาร/คณะรัฐประหาร

    // --- บทส่งท้าย ---
    final_provisions: "#A0AEC0",  // เทาเงิน
    transitory: "#4A5568",        // เทาเข้ม (Dark Gray) - บทเฉพาะกาล

    // --- อื่นๆ ---
    uncategorized: "#E2E8F0"      // เทาอ่อนมาก
};

export const getCatColor = (id: string) => CATEGORY_COLORS[id] || CATEGORY_COLORS.uncategorized;