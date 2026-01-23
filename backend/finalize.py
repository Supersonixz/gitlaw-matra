import json
import os
from main import TARGET_CONST_ID, OUTPUT_FILE as INPUT_FILE

# Output Config
OUTPUT_DIR = os.path.join("json_output", "final")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, f"{TARGET_CONST_ID}_final.json")


def convert_thai_numerals(text):
    """
    ฟังก์ชันแปลงเลขไทย (๐-๙) เป็นเลขอารบิก (0-9)
    """
    if not text or not isinstance(text, str):
        return ""

    # สร้างตารางจับคู่
    thai_digits = "๐๑๒๓๔๕๖๗๘๙"
    arabic_digits = "0123456789"
    translation_table = str.maketrans(thai_digits, arabic_digits)

    return text.translate(translation_table)


def finalize_dataset():
    if not os.path.exists(INPUT_FILE):
        print(f"❌ ไม่เจอไฟล์ {INPUT_FILE}")
        return

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    clean_data = []

    print(f"🧹 Cleaning & Converting Numerals for {len(raw_data)} sections...")

    for item in raw_data:
        final_content = ""

        # 1. เลือกเนื้อหาที่ดีที่สุด
        if item.get("status") == "VERIFIED" or item.get("status") == "OCR_ONLY":
            final_content = item.get("content", "")

        elif item.get("status") == "REVIEW_NEEDED":
            # กรณีขัดแย้ง เราเลือกเชื่อ OCR (ai_ocr) เพราะเรากำลังทำฉบับเก่า
            versions = item.get("diff_versions", {})
            final_content = versions.get("ai_ocr", item.get("content", ""))

        clean_content = convert_thai_numerals(final_content)

        # (Optional) แปลง ID ด้วยเผื่อมันหลุดมาเป็นเลขไทย
        clean_id = convert_thai_numerals(str(item["id"]))

        # สร้าง Object ใหม่
        clean_data.append(
            {
                "id": clean_id,
                "content": clean_content,
                "confidence": item.get("similarity", 0),
            }
        )

    try:
        clean_data.sort(key=lambda x: int(x["id"]) if x["id"].isdigit() else 9999)
    except:
        pass

    # Ensure output directory exists
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR, exist_ok=True)

    # บันทึกไฟล์ใหม่
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(clean_data, f, ensure_ascii=False, indent=2)

    print(
        f"✅ เสร็จสมบูรณ์! บันทึกข้อมูล {len(clean_data)} มาตรา (เลขอารบิก) ลงใน '{OUTPUT_FILE}' แล้ว"
    )


if __name__ == "__main__":
    finalize_dataset()
