import os
import time
import json
import sys
import logging
import re
import glob

# --- Configuration ---
RAW_DIR = "raw"  # โฟลเดอร์เก็บ PDF
JSON_DIR = "json"  # โฟลเดอร์เก็บ JSON ผลลัพธ์


# Configure Logging
def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    if logger.hasHandlers():
        logger.handlers.clear()

    # Force UTF-8 for Windows Console
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
            sys.stderr.reconfigure(encoding="utf-8")
        except AttributeError:
            pass

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logger.addHandler(handler)


setup_logging()

from config import CATEGORIES
from gemini_processor import process_pdf_with_gemini
from agents import AgentSummarizer

agent_summarizer = AgentSummarizer()


def get_year_from_filename(filename):
    """ดึงปี 4 หลักจากชื่อไฟล์ เช่น '2475-1.pdf' -> 2475"""
    match = re.search(r"(\d{4})", filename)
    if match:
        return int(match.group(1))
    return 0  # หาไม่เจอ


def process_pipeline(pdf_path):
    # 1. เตรียม Path และชื่อไฟล์
    filename = os.path.basename(pdf_path)  # "2475-1.pdf"
    file_stem = os.path.splitext(filename)[0]  # "2475-1"
    year = get_year_from_filename(filename)  # 2475

    # กำหนด path ไฟล์ผลลัพธ์ใน folder json/
    output_json_path = os.path.join(JSON_DIR, f"{file_stem}.json")
    summary_json_path = os.path.join(JSON_DIR, f"summary_{file_stem}.json")

    logging.info(f"🚀 Processing: {filename} (Year: {year})")

    # --- Step 1: PDF to JSON (Extraction) ---
    if os.path.exists(output_json_path):
        logging.info(f"⚡ JSON exists at {output_json_path}. Skipping Extraction.")
        # โหลดข้อมูลมาใช้ต่อใน Step 2
        with open(output_json_path, "r", encoding="utf-8") as f:
            all_sections = json.load(f)
    else:
        # ส่ง Gemini อ่าน
        try:
            extracted_data = process_pdf_with_gemini(pdf_path)
            all_sections = (
                extracted_data
                if isinstance(extracted_data, list)
                else extracted_data.get("sections", [])
            )

            # บันทึกไฟล์ JSON โดยใช้ชื่อเดียวกับ PDF (ไม่ทับกันแน่นอน)
            with open(output_json_path, "w", encoding="utf-8") as f:
                json.dump(all_sections, f, ensure_ascii=False, indent=2)
            logging.info(f"💾 Saved Raw Data to {output_json_path}")

        except Exception as e:
            logging.error(f"Failed to process PDF {filename}: {e}")
            return

    # --- Step 2: JSON to Summary ---
    if os.path.exists(summary_json_path):
        logging.info(f"⚡ Summary exists at {summary_json_path}. Skipping Summary.")
        return

    logging.info(f"📝 Generating Summaries for {filename}...")
    generate_summaries_from_data(all_sections, year, summary_json_path)


def generate_summaries_from_data(sections, year, output_path):
    logging.info(f"⚡ Single-Shot Summarization for Year {year}...")

    # 1. เตรียมข้อมูล (Data Preparation)
    grouped_content_for_ai = {}
    grouped_sections_raw = {}
    for section in sections:
        cat_id = section.get("category_id", "uncategorized")

        # Init list
        if cat_id not in grouped_content_for_ai:
            grouped_content_for_ai[cat_id] = []
            grouped_sections_raw[cat_id] = []

        # เก็บ Text ให้ AI (ใส่เลขมาตราให้อ่านง่าย)
        text_with_ref = f"[ม.{section.get('section_number')}] {section.get('content')}"
        grouped_content_for_ai[cat_id].append(text_with_ref)

        # เก็บ Object ดิบ
        grouped_sections_raw[cat_id].append(
            {
                "section_number": section.get("section_number"),
                "content": section.get("content"),
            }
        )

    # 2. ส่งงานให้ Agent (AI ประมวลผล)
    ai_results_dict = agent_summarizer.run_batch(grouped_content_for_ai)

    if not ai_results_dict:
        logging.error("❌ No summary data returned from AI. Skipping save.")
        return

    # 3. รวมร่าง (Merge AI Result + Raw Data)
    final_output_list = []

    for cat_id, cat_name in CATEGORIES.items():
        if cat_id not in grouped_content_for_ai:
            continue

        ai_data = ai_results_dict.get(cat_id, {})
        logging.info(
            f"   > Summarizing: {cat_id} ({len(grouped_content_for_ai[cat_id])} sections)"
        )

        final_output_list.append(
            {
                "constitution_year": year,
                "category_id": cat_id,
                "category_name": cat_name,
                # ส่วนบทวิเคราะห์
                "ai_summary": ai_data.get("summary", "ไม่มีการสรุป"),
                "key_change": ai_data.get("key_change", "-"),
                "section_count": len(grouped_sections_raw[cat_id]),
                # ส่วนหลักฐาน (Raw Data)
                "sections": grouped_sections_raw.get(cat_id, []),
            }
        )

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(final_output_list, f, ensure_ascii=False, indent=2)

    logging.info(f"✅ Saved Rich Summary (AI + Raw) to {output_path}")


if __name__ == "__main__":
    import sys

    # ตรวจสอบ API Key
    if not os.getenv("GOOGLE_API_KEY"):
        logging.error("CRITICAL: GOOGLE_API_KEY missing.")
        exit(1)

    # สร้าง Folder ปลายทางถ้ายังไม่มี
    os.makedirs(JSON_DIR, exist_ok=True)

    # ตรวจสอบ Folder ต้นทาง
    if not os.path.exists(RAW_DIR):
        logging.error(
            f"Folder '{RAW_DIR}' not found. Please create it and put PDFs inside."
        )
        exit(1)

    # --- ส่วนที่เพิ่มใหม่: เช็คว่า User สั่งเจาะจงไฟล์มาไหม? ---
    target_pdfs = []

    # กรณี 1: User สั่งเจาะจง (เช่น python main.py 2475-1.pdf)
    if len(sys.argv) > 1:
        specific_filename = sys.argv[1]  # รับชื่อไฟล์จากคำสั่ง
        specific_path = os.path.join(RAW_DIR, specific_filename)

        if os.path.exists(specific_path):
            target_pdfs = [specific_path]  # ทำแค่ไฟล์เดียว
            print(f"🎯 Single Mode: Selected '{specific_filename}'")
        else:
            logging.error(f"❌ File not found in {RAW_DIR}: {specific_filename}")
            exit(1)

    # กรณี 2: User ไม่ได้สั่งอะไรเลย -> เหมาหมด (Batch Mode)
    else:
        target_pdfs = glob.glob(os.path.join(RAW_DIR, "*.pdf"))
        print(f"📂 Batch Mode: Found {len(target_pdfs)} PDFs. Processing all...")

    if not target_pdfs:
        logging.error(f"No PDF files to process.")
        exit(1)

    # --- วนลูปทำงาน (รองรับทั้งไฟล์เดียวและหลายไฟล์) ---
    for pdf_path in target_pdfs:
        print("-" * 50)
        process_pipeline(pdf_path)

    print("\n🎉 All Done! Check the 'json' folder.")
