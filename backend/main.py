import os
import json
import glob
import logging
from google import genai
from google.genai import types

# Import Modules ของเรา
from merger import ConstitutionMerger
from agents import AgentSummarizer
from config import GOOGLE_API_KEY, CATEGORIES

# --- Config ---
TARGET_CONST_ID = "con2475temp"  # ID ของฉบับที่กำลังทำ
IMAGE_FOLDER = "images_raw"
LEGACY_JSON = os.path.join("legacy_json", "constitutions.json")

# Output Paths
OUTPUT_DIR_CLEAN = os.path.join("json_output", "clean")
OUTPUT_DIR_FINAL = os.path.join("json_output", "final")

FILE_CLEAN = os.path.join(OUTPUT_DIR_CLEAN, f"{TARGET_CONST_ID}_clean.json")
FILE_FINAL_SUMMARY = os.path.join(
    OUTPUT_DIR_FINAL, f"{TARGET_CONST_ID}_full_summary.json"
)

# Setup Logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

if not GOOGLE_API_KEY:
    raise ValueError("❌ GOOGLE_API_KEY is missing!")

client = genai.Client(api_key=GOOGLE_API_KEY)


# --- Helper Functions ---


def convert_thai_numerals(text):
    """แปลงเลขไทยเป็นอารบิก"""
    if not text or not isinstance(text, str):
        return ""
    return text.translate(str.maketrans("๐๑๒๓๔๕๖๗๘๙", "0123456789"))


def load_legacy_data(json_path, target_id):
    """โหลด JSON เดิม (ถ้ามี)"""
    if not os.path.exists(json_path):
        return {}
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    section_map = {}
    if isinstance(data, list):
        target = next((c for c in data if c.get("id") == target_id), None)
        if target and "sections" in target:
            for sec in target["sections"]:
                section_map[str(sec["id"])] = sec
    return section_map


def categorize_sections_with_ai(sections):
    """ให้ AI ช่วยแยก 18 หมวดหมู่"""
    logging.info(f"🤖 AI Categorizing {len(sections)} sections...")

    # ส่งแค่ ID กับ Content ไปเพื่อประหยัด Token
    sections_lite = [{"id": s["id"], "content": s["content"]} for s in sections]
    cats_text = "\n".join([f"- {k}: {v}" for k, v in CATEGORIES.items()])

    prompt = f"""
    Role: Thai Constitutional Law Expert.
    Task: Classify each section into exactly one of the 18 categories.
    Categories:
    {cats_text}
    Input (JSON):
    {json.dumps(sections_lite, ensure_ascii=False)}
    Output: JSON Object {{ "section_id": "category_id" }}
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        return json.loads(text)
    except Exception as e:
        logging.error(f"❌ Categorization Failed: {e}")
        return {}


def generate_summaries_from_data(sections, year, output_path):
    """ส่งข้อมูลที่จัดหมวดแล้วไปให้ Agent สรุป"""
    summarizer = AgentSummarizer()
    logging.info(f"⚡ Generating Summaries...")

    # Grouping
    grouped_content = {}
    grouped_raw = {}

    for section in sections:
        cat_id = section.get("category_id", "general")
        if cat_id not in grouped_content:
            grouped_content[cat_id] = []
            grouped_raw[cat_id] = []

        grouped_content[cat_id].append(
            f"[ม.{section['section_number']}] {section['content']}"
        )
        grouped_raw[cat_id].append(section)

    # Run Agent
    ai_results = summarizer.run_batch(grouped_content)

    # Merge Results
    final_output = []
    for cat_id, cat_name in CATEGORIES.items():
        if cat_id not in grouped_content:
            continue

        ai_data = ai_results.get(cat_id, {})
        final_output.append(
            {
                "constitution_year": year,
                "category_id": cat_id,
                "category_name": cat_name,
                "ai_summary": ai_data.get("summary", "ไม่มีการสรุป"),
                "key_change": ai_data.get("key_change", "-"),
                "section_count": len(grouped_raw[cat_id]),
                "sections": grouped_raw[cat_id],
            }
        )

    # Save
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(final_output, f, ensure_ascii=False, indent=2)
    logging.info(f"✅ FINAL SUCCESS! Summary saved to: {output_path}")


# --- Main Execution ---


def main():
    # 1. Setup & OCR
    merger = ConstitutionMerger()
    legacy_map = load_legacy_data(LEGACY_JSON, TARGET_CONST_ID)

    target_folder = os.path.join(IMAGE_FOLDER, TARGET_CONST_ID)
    if not os.path.exists(target_folder):
        logging.error(f"❌ Folder not found: {target_folder}")
        return

    image_files = sorted(
        glob.glob(os.path.join(target_folder, "*.[pjPJ][nNpP][gG]*")),
        key=lambda x: int("".join(filter(str.isdigit, os.path.basename(x))) or 0),
    )

    print(f"📂 Found {len(image_files)} images. Starting Pipeline...")

    # 2. Run OCR & Merge
    legacy_list = [{"id": k, "content": v["content"]} for k, v in legacy_map.items()]
    raw_sections = merger.process_batch_images(image_files, legacy_list)

    # 3. Clean & Finalize (เลือก Version ที่ดีที่สุด + แปลงเลขไทย)
    clean_sections = []
    print("🧹 Cleaning & Converting Numerals...")

    for item in raw_sections:
        # Logic เลือกเนื้อหา
        content = item["content"]
        if item.get("status") == "REVIEW_NEEDED":
            content = item["diff_versions"].get("legacy_json", content)

        # แปลงเลขไทย -> อารบิก
        clean_content = convert_thai_numerals(content)
        clean_id = convert_thai_numerals(str(item["id"]))

        clean_sections.append(
            {
                "id": clean_id,
                "content": clean_content,
                "status": item.get("status"),
                "similarity": item.get("similarity"),
                "diff_versions": item.get("diff_versions"),
            }
        )

    # Sort
    clean_sections.sort(key=lambda x: int(x["id"]) if x["id"].isdigit() else 9999)

    # Save Clean JSON (อันนี้จะมี status ครบแล้ว)
    os.makedirs(OUTPUT_DIR_CLEAN, exist_ok=True)
    with open(FILE_CLEAN, "w", encoding="utf-8") as f:
        json.dump(clean_sections, f, ensure_ascii=False, indent=2)
    print(f"💾 Saved Clean JSON to {FILE_CLEAN}")

    # 4. AI Categorize
    category_map = categorize_sections_with_ai(clean_sections)

    # 5. Transform for Summary (id -> section_number)
    ready_for_summary = []
    for item in clean_sections:
        sec_id = item["id"]
        ready_for_summary.append(
            {
                "section_number": sec_id,
                "content": item["content"],
                "category_id": category_map.get(sec_id, "general"),
                # 🔥 แก้ไข: ส่งต่อ Metadata ไปยังไฟล์ Final ด้วย
                "status": item.get("status"),
                "similarity": item.get("similarity"),
            }
        )

    # 6. Generate Final Summary
    try:
        year = int("".join(filter(str.isdigit, TARGET_CONST_ID)))
    except:
        year = 0

    os.makedirs(OUTPUT_DIR_FINAL, exist_ok=True)
    generate_summaries_from_data(ready_for_summary, year, FILE_FINAL_SUMMARY)


if __name__ == "__main__":
    main()
