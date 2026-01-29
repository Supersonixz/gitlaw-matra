import re
import logging
import time
from typhoon_ocr import ocr_document 
from tqdm import tqdm

logging.basicConfig(level=logging.INFO)

class ConstitutionMerger:
    def __init__(self):
        self.model_name = "typhoon-ocr" 

    def _clean_text(self, text):
        if not text: return ""
        text = re.sub(r'<page_number>.*?</page_number>', '', text)
        replacements = {
            "เหล่าก็เหน็ด": "เหล่ากำเนิด",
            "อำนาจอธิปไตยอ่อน": "อำนาจอธิปไตยย่อม",
            "อุบสภา": "ยุบสภา",
            "สำโวย": "โดย",
            "ไขว้": "ไซร้",
            "ฉะเพาะ": "เฉพาะ"
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        return text.strip()

    def _parse_markdown_to_json(self, markdown_text):
        sections = []
        text = markdown_text.replace("**", "").strip()
        
        chunks = re.split(r"(?:^|\n)มาตรา\s*([๐-๙0-9]+)", text)
        
        # ส่วน Intro (หน้าแรก)
        if chunks[0].strip():
            sections.append({
                "id": "intro",
                "content": self._clean_text(chunks[0]),
                "type": "intro",
                "status": "OCR"
            })
        
        # Loop มาตรา
        for i in range(1, len(chunks), 2):
            sec_id_raw = chunks[i].strip()
            content_raw = chunks[i+1].strip()
            
            sec_id = sec_id_raw.translate(str.maketrans("๐๑๒๓๔๕๖๗๘๙", "0123456789"))
            clean_content = self._clean_text(re.sub(r'\n+', ' ', content_raw))
            
            # Logic: เช็คว่ามี "หมวด/ส่วน" ติดอยู่ที่ท้ายประโยคไหม?
            # Regex: หาคำว่า "หมวด..." หรือ "ส่วนที่..." ที่อยู่ท้ายสุดของข้อความ
            split_pattern = r"(.*?)\s+(หมวด\s*[๐-๙0-9]+.*?|ส่วนที่\s*[๐-๙0-9]+.*?)$"
            match = re.search(split_pattern, clean_content)
            
            if match:
                # ถ้าเจอ -> แยกเป็น 2 ก้อน
                real_content = match.group(1).strip()
                header_text = match.group(2).strip()
                
                # 1. เก็บเนื้อหามาตรา (ตัดหมวดออกแล้ว)
                sections.append({
                    "id": sec_id,
                    "content": real_content,
                    "type": "section",
                    "status": "OCR"
                })
                
                # 2. เก็บหมวดเป็น ID ใหม่ (เพื่อให้เรียงต่อกันสวยๆ)
                # ตั้งชื่อ ID ให้รู้ว่าเป็น header ของ section นี้
                sections.append({
                    "id": f"header_after_{sec_id}", 
                    "content": header_text,
                    "type": "header",
                    "status": "OCR"
                })
            else:
                # ถ้าไม่เจอ -> เก็บปกติ
                sections.append({
                    "id": sec_id,
                    "content": clean_content,
                    "type": "section",
                    "status": "OCR"
                })
            
        return sections

    def process_batch_images(self, image_paths, existing_json_sections):
        all_sections = []
        for img_path in tqdm(image_paths, desc="OCR Processing"):
            try:
                md = ocr_document(img_path)
                parts = self._parse_markdown_to_json(md)
                all_sections.extend(parts)
                time.sleep(1)
            except Exception as e:
                logging.error(f"Error {img_path}: {e}")

        return all_sections