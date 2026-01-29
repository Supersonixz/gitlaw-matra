import os
import json
import logging
import time
import re
from google import genai
from google.genai import types

from agents import AgentSummarizer
from config import (
    GOOGLE_API_KEY, 
    CATEGORIES,
    TARGET_CONST_ID,
    OUTPUT_DIR_FINAL,
    FILE_CLEAN,
    FILE_FINAL_SUMMARY
)

# Setup Logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

if not GOOGLE_API_KEY:
    raise ValueError("❌ GOOGLE_API_KEY is missing!")

# Init Google Client
client = genai.Client(api_key=GOOGLE_API_KEY)


# --- AI Helper Functions ---

def _clean_json_text(text):
    """ฟังก์ชันช่วยแกะ JSON สำหรับโมเดลที่ไม่รองรับ JSON Mode"""
    text = text.strip()
    # 1. ลบ Markdown ```json ... ```
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[0].strip().startswith("```"):
            lines = lines[1:]
        if lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines)
    
    # 2. ลองหาปีกกาเปิด-ปิดตัวแรกและตัวสุดท้าย (เผื่อมี text นำหน้า/ตามหลัง)
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        text = text[start : end + 1]
    
    return text

def get_ai_header_mapping(headers_list):
    """
    ใช้ Gemma-3-27b-it ช่วย Map Header
    (เน้น Prompt Engineering แทน Config JSON)
    """
    if not headers_list:
        return {}

    logging.info(f"🤖 Asking Gemma-3 to map {len(headers_list)} headers...")
    
    cats_text = "\n".join([f"- {k}: {v}" for k, v in CATEGORIES.items()])
    headers_text = "\n".join([f"- {h}" for h in headers_list])

    prompt = f"""
    You are a Thai Constitutional Law Expert.
    Task: Map the input headers (some are archaic/historical) to the standard category IDs.
    
    Standard Categories:
    {cats_text}
    
    Input Headers:
    {headers_text}
    
    Instructions:
    1. Analyze the semantic meaning of each header.
       - "อภิรัฐมนตรี" -> monarchy (Privy Council equivalent)
       - "พฤฒสภา" -> legislative (Senate equivalent)
       - "กรรมการราษฎร" -> executive (Cabinet equivalent)
    2. Output ONLY a valid JSON object. Do not explain.
    3. Format: {{ "Input Header Text": "category_id" }}
    """

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemma-3-27b-it", 
                contents=prompt,
            )
            
            # Clean & Parse
            raw_text = response.text
            clean_text = _clean_json_text(raw_text)
            mapping = json.loads(clean_text)
            
            logging.info(f"✅ Gemma-3 Mapping Success! (Mapped {len(mapping)} items)")
            return mapping
            
        except Exception as e:
            logging.warning(f"⚠️ Mapping Failed (Attempt {attempt+1}): {e}")
            time.sleep(2)
    
    return {} # Fallback

def group_sections_with_smart_mapping(sections):
    """
    จัดกลุ่มโดยใช้ AI Mapping
    """
    # 1. ดึง Header ทั้งหมดออกมา
    headers_found = []
    for item in sections:
        if item.get("type") == "header" or str(item["id"]).startswith("header_"):
            headers_found.append(item["content"])
    
    # 2. ให้ AI สร้าง Map (Header -> CategoryID)
    unique_headers = list(set(headers_found))
    header_map = get_ai_header_mapping(unique_headers)
    
    # 3. จัดกลุ่มข้อมูล
    grouped_sections = []
    current_cat_id = "general" # Default
    
    summary_groups = { k: [] for k in CATEGORIES.keys() } 
    raw_groups = { k: [] for k in CATEGORIES.keys() }

    logging.info("⚡ Grouping sections using AI Map...")

    for item in sections:
        # ถ้าเจอ Header -> เปลี่ยนหมวดตามที่ AI บอก
        if item.get("type") == "header" or str(item["id"]).startswith("header_"):
            h_text = item["content"]
            # ดึงค่าจาก Map (ถ้าไม่มีให้เป็น general)
            new_cat = header_map.get(h_text, "general")
            
            current_cat_id = new_cat
            logging.info(f"   📌 Header: '{h_text}' -> AI mapped to: {current_cat_id}")
            continue 
            
        # ถ้าเป็น Intro
        if item.get("type") == "intro" or item["id"] == "intro":
            current_cat_id = "general"

        # ถ้าเป็น Section
        sec_id = str(item["id"])
        
        # Update Item
        item["category_id"] = current_cat_id
        grouped_sections.append(item)
        
        # Prepare for Summary
        if current_cat_id not in summary_groups:
             summary_groups[current_cat_id] = []
             raw_groups[current_cat_id] = [] # กันเหนียว
             
        summary_groups[current_cat_id].append(f"[ม.{sec_id}] {item['content']}")
        raw_groups[current_cat_id].append(item)

    return grouped_sections, summary_groups, raw_groups


def generate_summaries_from_data(grouped_content, raw_groups, year, output_path):
    """
    Step 2: สรุปเนื้อหา (ใช้ AgentSummarizer)
    """
    summarizer = AgentSummarizer()
    logging.info(f"⚡ Generating AI Summaries...")
    
    active_groups = {k: v for k, v in grouped_content.items() if v}
    ai_results = summarizer.run_batch(active_groups)

    final_output = []
    for cat_id in CATEGORIES.keys():
        if cat_id not in active_groups: continue

        ai_data = ai_results.get(cat_id, {})
        cat_name_th = CATEGORIES.get(cat_id, cat_id)
        
        final_output.append({
            "constitution_year": year,
            "category_id": cat_id,
            "category_name": cat_name_th,
            "ai_summary": ai_data.get("summary", "ไม่มีการสรุป"),
            "key_change": ai_data.get("key_change", "-"),
            "section_count": len(raw_groups[cat_id]),
            "sections": raw_groups[cat_id],
        })

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(final_output, f, ensure_ascii=False, indent=2)
    logging.info(f"✅ FINAL SUCCESS! Saved to: {output_path}")


# --- Main Execution ---

def main():
    if not os.path.exists(FILE_CLEAN):
        logging.error(f"❌ ไม่พบไฟล์ {FILE_CLEAN}")
        return

    print(f"📂 Loading Clean Data from: {FILE_CLEAN}")
    with open(FILE_CLEAN, "r", encoding="utf-8") as f:
        sections = json.load(f)
    
    print(f"✅ Loaded {len(sections)} items.")

    # 1. Group by AI-Mapped Headers
    enriched_sections, summary_groups, raw_groups = group_sections_with_smart_mapping(sections)

    # 2. Generate Final Summary
    try: year = int("".join(filter(str.isdigit, TARGET_CONST_ID)))
    except: year = 0
    
    os.makedirs(OUTPUT_DIR_FINAL, exist_ok=True)
    generate_summaries_from_data(summary_groups, raw_groups, year, FILE_FINAL_SUMMARY)


if __name__ == "__main__":
    main()