import json
import re
import easyocr
import difflib
import logging
from config import GOOGLE_API_KEY
from google import genai
from google.genai import types

# Set up Logging
logging.basicConfig(level=logging.INFO)

# Set up Google API
if not GOOGLE_API_KEY:
    logging.warning("GOOGLE_API_KEY is not set.")
    client = None
else:
    client = genai.Client(api_key=GOOGLE_API_KEY)


class ConstitutionMerger:
    def __init__(self):
        self.model_name = "gemini-2.5-flash"

        print("⏳ Loading EasyOCR Model...")
        self.reader = easyocr.Reader(["th", "en"], gpu=True)

    def _clean_json_response(self, text):
        """Helper: แกะ JSON จาก Markdown"""
        clean_text = text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]

        try:
            return json.loads(clean_text.strip())
        except json.JSONDecodeError:
            # Fallback: ใช้ Regex หา [...] ก้อนแรก
            try:
                match = re.search(r"\[.*\]", clean_text, re.DOTALL)
                if match:
                    return json.loads(match.group(0))
            except:
                pass
        return []

    def _calculate_similarity(self, text1, text2):
        return difflib.SequenceMatcher(None, text1, text2).ratio()

    def ai_extract_all_sections(self, full_ocr_text):
        """
        🚀 BATCH MODE: ส่งข้อความทั้งหมดให้ AI แกะทีเดียว
        """
        prompt = f"""
        Role: Thai Legal Document Parser.
        Task: Extract ALL legal sections (มาตรา) from the provided multi-page OCR text.
        
        Raw OCR Text (Joined from multiple pages):
        ---
        {full_ocr_text}
        ---
        
        Instructions:
        1. Identify all sections starting with "มาตรา".
        2. Merge broken text that spans across lines or pages.
        3. Convert Thai Numerals (๑, ๒) in Section IDs to Arabic Numbers (1, 2).
        4. Fix common OCR errors (e.g., vowels, broken words).
        5. Output strictly as a JSON Array.
        
        Output Format:
        [
            {{ "id": "1", "content": "ข้อความเต็ม..." }},
            {{ "id": "2", "content": "ข้อความเต็ม..." }}
        ]
        """

        try:
            # แก้ไขจุดที่ Error: ใช้ prompt ตัวแปรเดียวส่งเข้าไป
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,  # <--- แก้ตรงนี้ (ส่ง prompt ตรงๆ)
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                ),
            )

            result = self._clean_json_response(response.text)
            if result:
                return result
            else:
                logging.warning("⚠️ AI returned empty JSON")
                return []

        except Exception as e:
            logging.error(f"❌ AI Parsing Failed: {e}")
            return []

    def process_batch_images(self, image_paths, existing_json_sections):
        """
        ฟังก์ชันใหม่: รับ List ของรูปภาพทั้งหมด -> ทำทีเดียวจบ
        """
        # 1. OCR ทุกรูปมารวมกันก่อน
        all_raw_text = []
        print(f"👁️ Batch OCR Processing ({len(image_paths)} images)...")

        for idx, img_path in enumerate(image_paths):
            print(f"   Reading: {img_path}...")
            try:
                # detail=0 เอาแค่ข้อความ
                raw_lines = self.reader.readtext(img_path, detail=0)
                page_text = "\n".join(raw_lines)
                # ใส่ตัวคั่นหน้าเพื่อให้ AI รู้บริบท (แต่บอกให้ ignore ได้)
                all_raw_text.append(
                    f"--- Page {idx+1} Start ---\n{page_text}\n--- Page {idx+1} End ---"
                )
            except Exception as e:
                print(f"   ❌ Error reading {img_path}: {e}")

        full_text_blob = "\n\n".join(all_raw_text)

        if not full_text_blob.strip():
            return []

        # 2. ส่งก้อนใหญ่ให้ AI (Call เดียวจบ)
        print(
            f"🤖 Sending massive text blob ({len(full_text_blob)} chars) to Gemini..."
        )
        parsed_sections = self.ai_extract_all_sections(full_text_blob)
        print(f"✅ AI Extracted {len(parsed_sections)} sections.")

        # 3. Merge กับ Legacy JSON (Logic เดิม)
        final_sections = []
        json_map = {str(s["id"]): s["content"] for s in existing_json_sections}

        for item in parsed_sections:
            sec_id = str(item.get("id", "unknown"))
            ocr_content = item.get("content", "")

            if sec_id not in json_map:
                final_sections.append(
                    {
                        "id": sec_id,
                        "content": ocr_content,
                        "status": "OCR_ONLY",
                        "similarity": 0,
                    }
                )
            else:
                json_content = json_map[sec_id]
                similarity = self._calculate_similarity(ocr_content, json_content)

                if similarity > 0.8:
                    final_sections.append(
                        {
                            "id": sec_id,
                            "content": json_content,
                            "status": "VERIFIED",
                            "diff_versions": {
                                "ai_ocr": ocr_content,
                                "legacy_json": json_content,
                            },
                            "similarity": similarity,
                        }
                    )
                else:
                    final_sections.append(
                        {
                            "id": sec_id,
                            "content": ocr_content,
                            "status": "REVIEW_NEEDED",
                            "diff_versions": {
                                "ai_ocr": ocr_content,
                                "legacy_json": json_content,
                            },
                            "similarity": similarity,
                        }
                    )

        return final_sections
