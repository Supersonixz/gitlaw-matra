import json
import os
import logging
from google import genai
from google.genai import types
from config import GOOGLE_API_KEY, CATEGORIES
from agents import AgentSummarizer

# --- Config ---
# ไฟล์ที่ได้จากขั้นตอน finalize (ข้อมูลดิบที่ Clean แล้ว)
INPUT_FILE = "json_output/final/con2475_final.json"
# ไฟล์ผลลัพธ์สุดท้าย (ที่มีทั้งเนื้อหา + หมวดหมู่ + สรุป)
OUTPUT_FILE = "json_output/final/con2475_full_summary.json"

# ตั้งค่า Logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

if not GOOGLE_API_KEY:
    raise ValueError("❌ GOOGLE_API_KEY is missing!")

client = genai.Client(api_key=GOOGLE_API_KEY)


def categorize_sections_with_ai(sections):
    """
    ฟังก์ชันใหม่: ส่งมาตราทั้งหมดไปให้ AI แยก 18 หมวดหมู่ทีเดียว
    """
    logging.info(f"🤖 Categorizing {len(sections)} sections...")

    # เตรียมข้อมูลส่ง AI (เอาแค่ id กับ content พอ)
    sections_lite = [{"id": s["id"], "content": s["content"]} for s in sections]
    categories_text = "\n".join([f"- {k}: {v}" for k, v in CATEGORIES.items()])

    prompt = f"""
    Role: Thai Constitutional Law Expert.
    Task: Classify each legal section into exactly one of the provided 18 categories.
    
    Categories:
    {categories_text}
    
    Input Data (JSON):
    {json.dumps(sections_lite, ensure_ascii=False)}
    
    Instructions:
    1. Analyze the content of each section.
    2. Map section 'id' to the most appropriate 'category_id'.
    3. Return ONLY a JSON object mapping IDs to Categories.
    
    Output Example:
    {{
        "1": "general",
        "2": "monarchy",
        "65": "transitory"
    }}
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )

        # แกะ JSON
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        return json.loads(text)

    except Exception as e:
        logging.error(f"❌ Categorization Failed: {e}")
        return {}


def generate_summaries_from_data(sections, year, output_path):
    """
    (ยกมาจาก Code เก่าของคุณ) Logic การสรุปความ
    """
    agent_summarizer = AgentSummarizer()
    logging.info(f"⚡ Generating Summaries for Year {year}...")

    # 1. จัดกลุ่มข้อมูล (Grouping)
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
        grouped_sections_raw[cat_id].append(section)

    # 2. ส่งงานให้ Agent (AI ประมวลผล Batch Summary)
    logging.info("🧠 Sending grouped content to AgentSummarizer...")
    ai_results_dict = agent_summarizer.run_batch(grouped_content_for_ai)

    if not ai_results_dict:
        logging.error("❌ No summary data returned from AI.")
        return

    # 3. รวมร่าง (Merge)
    final_output_list = []

    for cat_id, cat_name in CATEGORIES.items():
        if cat_id not in grouped_content_for_ai:
            continue

        ai_data = ai_results_dict.get(cat_id, {})
        logging.info(
            f"   > Processed: {cat_name} ({len(grouped_sections_raw[cat_id])} sections)"
        )

        final_output_list.append(
            {
                "constitution_year": year,
                "category_id": cat_id,
                "category_name": cat_name,
                "ai_summary": ai_data.get("summary", "ไม่มีการสรุป"),
                "key_change": ai_data.get("key_change", "-"),
                "section_count": len(grouped_sections_raw[cat_id]),
                "sections": grouped_sections_raw.get(cat_id, []),
            }
        )

    # Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(final_output_list, f, ensure_ascii=False, indent=2)

    logging.info(f"✅ Success! Full summary saved to: {output_path}")


def main():
    if not os.path.exists(INPUT_FILE):
        logging.error(f"❌ Input file not found: {INPUT_FILE}")
        return

    # 1. Load Data (Clean JSON)
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        clean_sections = json.load(f)

    logging.info(f"📂 Loaded {len(clean_sections)} sections from clean JSON.")

    # 2. AI Categorize (ติดป้ายหมวดหมู่)
    category_map = categorize_sections_with_ai(clean_sections)

    # 3. Transform Data (แปลงร่างให้เข้ากับ Code เก่า)
    ready_sections = []
    for item in clean_sections:
        sec_id = str(item["id"])

        # Mapping Fields
        new_item = {
            "section_number": sec_id,  # id -> section_number
            "content": item["content"],  # content -> content
            "category_id": category_map.get(sec_id, "general"),  # ใส่หมวดที่ AI บอกมา
        }
        ready_sections.append(new_item)

    # 4. Run Summary Pipeline (ส่งไม้ต่อให้ระบบเก่า)
    # สมมติว่าเป็นปี 2475 (หรือดึงจากชื่อไฟล์เอาก็ได้)
    generate_summaries_from_data(ready_sections, 2475, OUTPUT_FILE)


if __name__ == "__main__":
    main()
