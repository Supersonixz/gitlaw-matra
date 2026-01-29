import os
import glob
import json
import logging
import time
import re
from difflib import SequenceMatcher
from merger import ConstitutionMerger 

# --- Config ---
from config import (
    OPENROUTER_API_KEY, 
    TARGET_CONST_ID, 
    IMAGE_FOLDER, 
    LEGACY_JSON,
    IMAGES_PER_BATCH,
    CHECKPOINT_FILE,
    OUTPUT_DIR_CLEAN,
    FILE_CLEAN
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")

if not os.getenv("TYPHOON_OCR_API_KEY"):
    logging.warning("⚠️ Warning: TYPHOON_OCR_API_KEY not found!")

# --- Helper Functions ---

def convert_thai_numerals(text):
    """แปลงเลขไทยในเนื้อหาให้เป็นอารบิก"""
    if not text or not isinstance(text, str): return ""
    return text.translate(str.maketrans("๐๑๒๓๔๕๖๗๘๙", "0123456789"))

def load_legacy_data(json_path, target_id):
    if not os.path.exists(json_path): return {}
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        section_map = {}
        if isinstance(data, list):
            target = next((c for c in data if c.get("id") == target_id), None)
            if target and "sections" in target:
                for sec in target["sections"]:
                    section_map[str(sec["id"])] = sec["content"] 
        return section_map
    except:
        return {}

def calculate_similarity(a, b):
    return SequenceMatcher(None, str(a), str(b)).ratio()

def get_numeric_id(sec_id):
    try:
        # พยายามแปลงทั้งเลขไทยและอารบิก
        clean_id = str(sec_id).translate(str.maketrans("๐๑๒๓๔๕๖๗๘๙", "0123456789"))
        return int(re.search(r"\d+", clean_id).group())
    except:
        return None

def smart_heal_sequence(items):
    healed_items = []
    all_numeric_ids = []
    for item in items:
        nid = get_numeric_id(item["id"])
        if nid: all_numeric_ids.append(nid)
    
    missing_ids = []
    if all_numeric_ids:
        full_range = set(range(min(all_numeric_ids), max(all_numeric_ids) + 1))
        missing_ids = list(full_range - set(all_numeric_ids))
        missing_ids.sort()

    print(f"🔍 ตรวจพบเลขที่หายไป: {missing_ids}")

    # Flag เพื่อเช็คว่าเจอ Intro ตัวแรกไปหรือยัง
    first_intro_processed = False

    for i in range(len(items)):
        curr = items[i]
        curr_id_str = str(curr.get("id", "")).strip()
        curr_nid = get_numeric_id(curr_id_str)
        
        # Merge Intro
        is_intro = curr_id_str.lower() == "intro" or not curr_id_str
        if is_intro:
            if healed_items and first_intro_processed: 
                # ถ้าไม่ใช่ตัวแรก ให้รวมกับตัวก่อนหน้า (Continuation)
                print(f"   🔗 พบ intro/continuation -> รวมเข้ากับมาตรา {healed_items[-1]['id']}")
                healed_items[-1]["content"] += " " + curr.get("content", "")
            else:
                # FIX: ถ้าเป็น Intro ตัวแรกสุด ให้เช็คว่ามี 'หมวด' ซ่อนอยู่ไหม?
                content = curr.get("content", "")
                
                # Regex หาคำว่า "หมวด..." ที่อยู่ท้ายข้อความ
                match = re.search(r"(หมวด\s*[๐-๙0-9]+.*?)$", content, re.DOTALL)
                
                if match:
                    print(f"   ✂️ แยก Header ออกจาก Intro แรก...")
                    header_text = match.group(1).strip()
                    intro_content = content[:match.start()].strip()
                    
                    # 1. เก็บ Intro ที่ตัดแล้ว
                    curr["content"] = intro_content
                    healed_items.append(curr)
                    
                    # 2. สร้าง Header ใหม่แทรกเข้าไป
                    try:
                        cat_num = get_numeric_id(header_text) or 1
                    except:
                        cat_num = 1
                        
                    header_item = {
                        "id": f"header_{cat_num}", 
                        "content": header_text,
                        "type": "header",
                        "status": "OCR"
                    }
                    healed_items.append(header_item)
                else:
                    # ถ้าไม่มีหมวด ก็เก็บ Intro ไว้เฉยๆ
                    healed_items.append(curr)
                
                first_intro_processed = True
            continue 

        # Fix Sequence
        if i + 1 < len(items):
            next_item = items[i+1]
            next_nid = get_numeric_id(next_item.get("id", ""))
            
            if curr_nid and next_nid and curr_nid > next_nid:
                candidate_fix = next_nid - 1
                if candidate_fix in missing_ids:
                    print(f"   🔧 ซ่อมลำดับ: เปลี่ยน {curr_id_str} -> {candidate_fix}")
                    curr["id"] = str(candidate_fix)
                    if candidate_fix in missing_ids: missing_ids.remove(candidate_fix)

        healed_items.append(curr)
    return healed_items

def main():
    target_folder = os.path.join(IMAGE_FOLDER, TARGET_CONST_ID)
    if not os.path.exists(target_folder): return print("❌ Folder not found")
    
    # 1. โหลด Legacy Data
    legacy_map = load_legacy_data(LEGACY_JSON, TARGET_CONST_ID)
    print(f"📚 Loaded Legacy Data: {len(legacy_map)} sections found.")

    # 2. OCR Pipeline
    image_files = sorted(
        glob.glob(os.path.join(target_folder, "*.[pjPJ][nNpP][gG]*")),
        key=lambda x: int("".join(filter(str.isdigit, os.path.basename(x))) or 0)
    )
    
    processed_batches = {} 
    if os.path.exists(CHECKPOINT_FILE):
        print(f"🔄 Resuming from {CHECKPOINT_FILE}...")
        with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            processed_batches = {int(k): v for k, v in data.items()}

    image_batches = [image_files[i:i + IMAGES_PER_BATCH] for i in range(0, len(image_files), IMAGES_PER_BATCH)]
    merger = ConstitutionMerger()

    for idx, batch_paths in enumerate(image_batches):
        batch_num = idx + 1
        if batch_num in processed_batches:
            print(f"⏩ Skipping Batch {batch_num} (Done)")
            continue

        print(f"⚡ Processing Batch {batch_num}...")
        try:
            result = merger.process_batch_images(batch_paths, []) 
            processed_batches[batch_num] = result
            with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
                json.dump(processed_batches, f, ensure_ascii=False, indent=2)
            print(f"   ✅ Batch {batch_num} Saved.")
        except Exception as e:
            print(f"   ❌ Error Batch {batch_num}: {e}")

    # --- 🔥 PHASE 2: SMART MERGE ---
    print("\n🧠 Starting Smart Merge & Heal Sequence...")
    raw_sequence = []
    for b_num in sorted(processed_batches.keys()):
        raw_sequence.extend(processed_batches[b_num])

    healed_sequence = smart_heal_sequence(raw_sequence)

    final_dict = {}
    for item in healed_sequence:
        sec_id = str(item["id"])
        if sec_id in final_dict:
            if not sec_id.startswith("header_"):
                final_dict[sec_id]["content"] += " " + item["content"]
        else:
            final_dict[sec_id] = item

    final_list = list(final_dict.values())
    
    def sort_key(x):
        s = str(x["id"])
        
        # Intro อยู่บนสุด
        if s.lower() == "intro": return -1.0
        
        # Header แทรกกลาง (header_after_7 -> 7.5)
        if s.startswith("header_after_"):
            try: return float(s.replace("header_after_", "")) + 0.5 
            except: return 9999.5 
        
        # Header ปกติ (header_1 -> 0.9)
        if s.startswith("header_"): 
            try: return float(s.replace("header_", "")) - 0.1
            except: return 0
            
        # มาตราปกติ
        try: return float(s)
        except: return 9999

    final_list.sort(key=sort_key)

    # --- 🔥 PHASE 3: FINAL CLEANUP & COMPARISON ---
    print("\n🧹 Converting Numerals & Comparing Legacy...")
    
    for item in final_list:
        sec_id = str(item["id"])
        
        item["content"] = convert_thai_numerals(item["content"])
        
        ocr_content = item["content"]
        item["status"] = "OCR_ONLY"
        item["similarity"] = 0.0
        
        if sec_id in legacy_map:
            legacy_content = legacy_map[sec_id]
            sim = calculate_similarity(ocr_content, legacy_content)
            
            item["similarity"] = round(sim, 4)
            item["diff_versions"] = {
                "ai_ocr": ocr_content,
                "legacy_json": legacy_content
            }
            
            if sim > 0.85:
                item["status"] = "VERIFIED"
            else:
                item["status"] = "REVIEW_NEEDED"

    os.makedirs(OUTPUT_DIR_CLEAN, exist_ok=True)
    with open(FILE_CLEAN, "w", encoding="utf-8") as f:
        json.dump(final_list, f, ensure_ascii=False, indent=2)
    
    print(f"\n🎉 DONE! Saved {len(final_list)} sections to {FILE_CLEAN}")

if __name__ == "__main__":
    main()