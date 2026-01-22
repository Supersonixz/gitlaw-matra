ถ้าคุณอยากใช้ "ระบบของผม" (ซึ่งคือ Google Gemini) เพื่ออ่าน PDF โดยตรงแบบที่ผมทำให้ดูเมื่อกี้ โดยไม่ต้องมานั่งเขียนโค้ด pdfplumber ให้ปวดหัวกับสระลอยหรือวรรคตอน...

ทำได้ครับ! และง่ายกว่าวิธีเดิมมากด้วย

สิ่งที่คุณต้องใช้คือ Google Gemini API (ผ่าน library google-generativeai) ซึ่งมีความสามารถที่เรียกว่า "Native Document Processing" ครับ

ความแตกต่างคือ:
วิธีเดิม (z.ai + pdfplumber): คุณต้อง "แกะ" ตัวหนังสือออกมาเองก่อน (ซึ่งเสี่ยงเพี้ยน) แล้วค่อยส่ง Text ไปให้ AI

วิธีของผม (Gemini API): คุณ "โยนไฟล์ PDF ทั้งก้อน" ให้ API เลยครับ เดี๋ยวผมจัดการ OCR + Clean + จัด Format ให้เสร็จในขั้นตอนเดียว (เหมือนที่คุณเห็นในแชทเมื่อกี้เป๊ะ)

วิธีเขียน Code เพื่อใช้ "ระบบของผม" (Gemini 1.5 Flash/Pro)
เนื่องจากคุณเป็นนักศึกษา คุณน่าจะขอ API Key ของ Google AI Studio มาใช้ได้ฟรี (มี Free Tier วันละ 1,500 requests สำหรับ 1.5 Flash ซึ่งเหลือเฟือสำหรับโปรเจกต์นี้)

1. ติดตั้ง Library
Bash

pip install -q -U google-generativeai
2. Python Code (เปลี่ยนจาก utils.py เดิม มาใช้ตัวนี้แทน)
โค้ดนี้จะรับ PDF -> ส่งเข้า Google Server -> คืนค่าเป็น JSON กลับมาทันทีครับ

Python

import os
import time
import json
import google.generativeai as genai
from google.ai.generativelanguage.v1beta.types import content

# 1. ตั้งค่า API Key (ไปขอได้ที่ aistudio.google.com)
os.environ["GOOGLE_API_KEY"] = "YOUR_GOOGLE_API_KEY_HERE"
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

def process_pdf_with_gemini(pdf_path):
    print(f"Uploading {pdf_path} to Gemini...")
    
    # 2. อัปโหลดไฟล์ PDF ขึ้นไปบน Google Server (ชั่วคราว)
    sample_file = genai.upload_file(path=pdf_path, display_name="Constitution Doc")
    
    # รอให้ไฟล์ Process เสร็จ (ปกติ 2-3 วินาที)
    while sample_file.state.name == "PROCESSING":
        print("Waiting for file processing...")
        time.sleep(2)
        sample_file = genai.get_file(sample_file.name)

    if sample_file.state.name == "FAILED":
        raise ValueError("File upload failed.")

    print("File processed! Asking Gemini to extract data...")

    # 3. เลือก Model (แนะนำ gemini-1.5-flash เพราะเร็วและถูก หรือ 1.5-pro ถ้าต้องการความแม่นยำสูงสุด)
    model = genai.GenerativeModel(model_name="gemini-1.5-flash")

    # 4. ยิง Prompt สั่งงาน (Prompt เดียวจบ ไม่ต้องแยก Agent)
    prompt = """
    Role: Thai Legal Document Specialist.
    Task: Extract data from this PDF into a JSON structure.
    
    Instructions:
    1. Read the entire document (OCR is handled automatically).
    2. Ignore page numbers, headers, and footers.
    3. Fix broken lines and spacing issues automatically.
    4. Extract each 'Section' (มาตรา) and classify its category immediately.
    
    Categories to classify:
    [preamble, general, monarchy, rights_duties, legislative, executive, judicial, coup_power, transitory, etc...]

    Output Format (JSON Array):
    [
      {
        "section_number": "1",
        "content": "ประเทศไทยเป็นราชอาณาจักรอันหนึ่งอันเดียว...",
        "category_id": "general"
      },
      ...
    ]
    """

    # สั่งให้ Model ตอบกลับเป็น JSON เท่านั้น
    response = model.generate_content(
        [sample_file, prompt],
        generation_config={"response_mime_type": "application/json"}
    )

    # 5. ลบไฟล์ออกจาก Server เพื่อความสะอาด
    genai.delete_file(sample_file.name)

    return json.loads(response.text)

# --- ลองเรียกใช้งาน ---
if __name__ == "__main__":
    result = process_pdf_with_gemini("750627_166_49.pdf")
    
    # Save ผลลัพธ์
    with open("result_gemini.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
        
    print("Success! Check result_gemini.json")
ทำไมวิธีนี้ถึง "เทพ" กว่า?
Native OCR: มันอ่าน "ภาพ" ใน PDF ครับ ไม่ได้อ่าน Text layer ดังนั้นเอกสารเก่าๆ ปี 2475 ที่เป็นลายมือหรือพิมพ์ดีดเลือนๆ (Scanned Image) มันก็อ่านออก!

Context Window ใหญ่มาก: Gemini 1.5 รองรับ Token ได้ถึง 1-2 ล้าน Token นั่นแปลว่าคุณโยน "รัฐธรรมนูญทั้งเล่ม" (100 หน้า) เข้าไปทีเดียวได้เลย ไม่ต้องวนลูปทีละหน้า (แต่ถ้าไฟล์ใหญ่มาก แนะนำให้แบ่งครึ่งจะชัวร์กว่า)

JSON Mode: สั่ง response_mime_type": "application/json" รับประกันว่า Code ไม่พังเพราะวงเล็บหาย