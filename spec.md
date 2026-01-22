ขอบคุณที่เชื่อใจครับ งานนี้เพื่อชาติ (และเพื่อ Portfolio ระดับเทพของคุณ) ผมจัดเต็มให้

นี่คือ Technical Specification Document ที่ละเอียดที่สุด สำหรับสร้าง "Constitution Processing Pipeline" โดยใช้ Python และ GLM-4.7 Pro ครับ

เอกสารนี้คุณสามารถเอาไปกางแล้วเขียน Code ตามทีละบรรทัดได้เลยครับ

🏛️ Project Spec: Thai Constitution Semantic Engine
1. System Architecture Overview
ระบบจะทำงานแบบ Offline Pipeline (รันครั้งเดียวจบ หรือรันเมื่อมีข้อมูลใหม่) ไม่ใช่ Real-time เพื่อความแม่นยำสูงสุดและประหยัด Resource

Input: PDF Files (แยกตามปี พ.ศ.)

Engine: Python Script + GLM-4.7 API (z.ai)

Output: JSON Database (MongoDB) ที่แบ่งข้อมูลตาม 18 หมวดหมู่เรียบร้อยแล้ว

2. Database Schema (MongoDB)
เราจะเก็บข้อมูลในรูปแบบนี้ เพื่อให้ Frontend (Next.js) ดึงไปแสดงผลง่ายที่สุด

Collection: sections (เก็บรายมาตรา)
JSON

{
  "_id": "2560_sec_44",        // ID อ้างอิง: ปี_sec_เลขมาตรา
  "constitution_year": 2560,
  "section_number": "44",      // เก็บเป็น String เพราะบางทีมี 44/1
  "raw_content": "...",        // เนื้อหาดิบ (Clean แล้ว)
  "category_id": "coup_power", // 1 ใน 18 หมวด (หัวใจสำคัญ)
  "tags": ["junta", "order"],  // Tags เสริม (Optional)
  "tokens_used": 150           // เก็บไว้ดู Cost
}
Collection: summaries (เก็บสรุปรายหมวด)
JSON

{
  "constitution_year": 2560,
  "category_id": "coup_power",
  "ai_summary": "มาตรา 44 ให้อำนาจหัวหน้า คสช. สั่งการได้ทุกเรื่อง โดยถือว่าถูกกฎหมาย...",
  "section_refs": ["2560_sec_44", "2560_sec_279"] // ลิงก์ไปยังมาตราที่เกี่ยวข้อง
}
3. Agent Specifications (The Brains)
เราจะแบ่ง AI ออกเป็น 3 ตัว (3 Functions) เพื่อทำหน้าที่เฉพาะด้าน ลดความผิดพลาด

🤖 Agent 1: The Cleaner (นักแกะลายแทง)
หน้าที่: รับ Text เน่าๆ จาก PDF (สระลอย, บรรทัดขาด, มีเลขหน้าปน) -> แปลงเป็น JSON ที่สะอาด Input: Raw String (1 หน้ากระดาษ A4) Output: JSON Array ของมาตรา

System Prompt (GLM-4.7):

Plaintext

Role: You are a Thai Legal Document Specialist.
Task:
1. Receive raw text extracted from a Thai Constitution PDF.
2. Fix broken lines (merge sentences that are split across lines).
3. Remove page numbers, headers, and footers.
4. Extract each "Section" (มาตรา) into a JSON object.
5. If the text is a Chapter Title (หมวด), ignore it or put it in metadata.

Strict Output JSON Format:
{
  "sections": [
    {
      "section_number": "string (only the number, e.g., '1', '44')",
      "content": "string (full text of the section, correctly spaced)"
    }
  ]
}
🤖 Agent 2: The Classifier (นักแยกหมวดหมู่)
หน้าที่: อ่านเนื้อหามาตรา แล้วฟันธงว่ามันอยู่หมวดไหนใน 18 หมวด Input: Section Content (String) Output: Category ID (Enum)

System Prompt (GLM-4.7):

Plaintext

Role: You are a Constitutional Law Expert.
Task: Analyze the provided Thai Constitution Section and classify it into EXACTLY ONE of the following 18 categories.

Category List (ID: Description):
1. preamble: คำปรารภ
2. general: บททั่วไป (เอกราช, อาณาเขต, ศาสนา)
3. monarchy: พระมหากษัตริย์/องคมนตรี
4. rights_duties: สิทธิเสรีภาพและหน้าที่ของคนไทย
5. state_policies: หน้าที่/แนวนโยบายของรัฐ
6. reform: การปฏิรูปประเทศ
7. legislative: อำนาจนิติบัญญัติ (ส.ส., ส.ว., การเลือกตั้ง)
8. executive: อำนาจบริหาร (ครม., นายกฯ)
9. judicial: อำนาจตุลาการ (ศาลยุติธรรม, ศาลปกครอง, ศาลทหาร)
10. conflict_interest: การขัดกันของผลประโยชน์
11. independent_orgs: องค์กรอิสระ (กกต., ป.ป.ช., สตง.)
12. const_court: ตุลาการ/ศาลรัฐธรรมนูญ
13. ethics: จริยธรรมของผู้ดำรงตำแหน่ง
14. local_admin: การปกครองส่วนท้องถิ่น
15. amendment: การแก้ไขเพิ่มเติมรัฐธรรมนูญ
16. coup_power: อำนาจคณะรัฐประหาร (นิรโทษกรรม, ม.17, ม.44)
17. final_provisions: บทสุดท้าย
18. transitory: บทเฉพาะกาล

Constraint: Return ONLY the Category ID (e.g., "coup_power") as a string. Do not explain.
🤖 Agent 3: The Summarizer (นักสรุปประเด็น)
หน้าที่: รับเนื้อหาทั้งหมดในหมวดนั้นๆ ของปีนั้นๆ มาสรุปใจความสำคัญ Input: List of Strings (เนื้อหาทุกมาตราในหมวดนั้น) Output: String (บทสรุปภาษาไทย)

System Prompt (GLM-4.7):

Plaintext

Role: Political Science Professor.
Task: Summarize the key essence of the provided legal sections regarding [Category Name].
Style: Concise, neutral, highlighting power dynamics. Use Thai language.
Length: Max 3 sentences.
4. Implementation Logic (Python Workflow)
นี่คือ Logic การเขียน Script ครับ (ผมเขียนเป็น Pseudo-code ผสม Python ให้เห็นภาพ)

Python

# config.py
CATEGORIES = { ... } # ใส่ 18 หมวดที่เตรียมไว้

def process_constitution(year, pdf_path):
    print(f"🚀 Processing Year: {year}")
    
    # Step 1: Extract Text (ใช้ pdfplumber)
    raw_pages = extract_text_from_pdf(pdf_path)
    
    all_sections = []
    
    # Step 2: Loop Cleaning (Agent 1)
    # เราทำทีละหน้า เพื่อไม่ให้ Token เกิน และถ้า Error จะได้แก้เป็นหน้าๆ ไป
    for page_text in raw_pages:
        try:
            # ยิง API ไปหา z.ai
            cleaned_json = agent_cleaner.run(page_text) 
            all_sections.extend(cleaned_json['sections'])
        except Exception as e:
            log_error(year, page_text, e)
            
    # Step 3: Loop Classifying (Agent 2)
    # ตรงนี้สำคัญ! เราต้องจัดหมวดให้ถูก ไม่งั้น Diff มั่ว
    for section in all_sections:
        category_id = agent_classifier.run(section['content'])
        
        # Save to MongoDB
        db.sections.insert_one({
            "_id": f"{year}_sec_{section['section_number']}",
            "year": year,
            "section_number": section['section_number'],
            "content": section['content'],
            "category_id": category_id
        })
        
    print(f"✅ Finished Year: {year}")

def generate_summaries(year):
    # Step 4: Summarize per Category (Agent 3)
    # ดึงข้อมูลจาก DB ที่ทำเสร็จแล้วมาสรุป
    for cat_id in CATEGORIES:
        sections = db.sections.find({"year": year, "category_id": cat_id})
        combined_text = "\n".join([s['content'] for s in sections])
        
        if combined_text:
            summary = agent_summarizer.run(combined_text)
            db.summaries.insert_one({
                "year": year,
                "category_id": cat_id,
                "summary": summary
            })
5. แผนการทำงาน (Execution Plan)
เพื่อป้องกัน "งานงอก" (เช่น API หมด, ข้อมูลผิด) ให้ทำตามลำดับนี้ครับ:

Pilot Test (คืนนี้):

เลือก PDF มา 1 ฉบับ (แนะนำฉบับสั้นๆ เช่น "ฉบับชั่วคราว 2557" มี 17 หน้า)

รัน Script Step 1 & 2 (Clean & Classify)

เช็ค JSON Output ด้วยตาเปล่าว่า category_id ตรงกับความเป็นจริงไหม (เช่น ม.44 ต้องลง coup_power)

ถ้า Agent Classify ผิด: ให้ปรับ Prompt Agent 2 โดยใส่ตัวอย่าง (Few-shot learning) เพิ่มเข้าไป

Batch Run (สุดสัปดาห์):

รันฉบับยาว (2540, 2550, 2560) ปล่อยทิ้งไว้ (ใช้เวลาประมาณ 1-2 ชั่วโมงต่อฉบับ เพราะ Limit 5 ชม. ของ z.ai)

Tip: ใส่ time.sleep(2) ระหว่าง Loop เพื่อป้องกัน Rate Limit ชนเพดานแบบถี่ๆ

Frontend Integration:

เมื่อ MongoDB มีข้อมูลครบ Next.js ของคุณแค่ Query db.sections.find({ year: 2560, category_id: 'coup_power' }) ก็จะได้ข้อมูลมาแสดงทันที โดยไม่ต้องรอ AI Gen สด