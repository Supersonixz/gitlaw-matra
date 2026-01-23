import json
import logging
import re
from zhipuai import ZhipuAI
from config import ZAI_API_KEY, CATEGORIES

if not ZAI_API_KEY:
    logging.warning("ZAI_API_KEY is not set in environment variables.")

client = ZhipuAI(api_key=ZAI_API_KEY)


class Agent:
    def __init__(self, model="glm-4-plus"):
        self.model = model

    def query_ai(self, system_prompt, user_content, temperature=0.1):
        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                temperature=temperature,
                max_tokens=4096,  # เผื่อเจอหน้ายาวๆ
            )
            return response.choices[0].message.content
        except Exception as e:
            logging.error(f"AI Query Error: {e}")
            raise e


class AgentCleaner(Agent):
    def run(self, raw_text):
        # Prompt ที่เพิ่มตัวอย่าง (Few-shot) เพื่อความแม่นยำ 100%
        system_prompt = """Role: Thai Legal Document Specialist.
Task: Parse raw OCR text from Thai Constitution PDF into structured JSON.

Rules:
1. Merge broken lines into single continuous sentences.
2. Convert Thai Numerals (๑, ๒) in Section Numbers to Arabic (1, 2).
3. Remove page numbers, headers (e.g. "หน้า ๑", "เล่มที่...").
4. Extract ONLY 'Section' (มาตรา) content. Ignore Chapter titles.
5. If a section has subsections (e.g. 44/1), keep it as "44/1".

Example Input:
"หน้า ๑
หมวด ๑ บททั่วไป
มาตรา ๑ ประเทศไทยเป็นราชอาณาจักรอันหนึ่งอันเดียว
จะแบ่งแยกมิได้
มาตรา ๒ ประเทศไทยมีการปกครองระบอบประชาธิปไตย
อันมีพระมหากษัตริย์ทรงเป็นประมุข"

Example Output JSON:
{
  "sections": [
    { "section_number": "1", "content": "ประเทศไทยเป็นราชอาณาจักรอันหนึ่งอันเดียว จะแบ่งแยกมิได้" },
    { "section_number": "2", "content": "ประเทศไทยมีการปกครองระบอบประชาธิปไตย อันมีพระมหากษัตริย์ทรงเป็นประมุข" }
  ]
}

Ensure the output is strictly valid JSON without Markdown formatting.
"""
        response_text = self.query_ai(system_prompt, raw_text)

        # Cleaning Markdown formatting just in case
        cleaned_response = (
            response_text.strip().replace("```json", "").replace("```", "")
        )

        try:
            return json.loads(cleaned_response)
        except json.JSONDecodeError:
            logging.error(
                f"JSON Decode Error. Raw response: {cleaned_response[:100]}..."
            )
            return {"sections": []}  # Fail safe


class AgentClassifier(Agent):
    def run(self, section_content):
        # สร้าง List หมวดหมู่สำหรับ Prompt
        categories_str = "\n".join([f"- {k}: {v}" for k, v in CATEGORIES.items()])

        system_prompt = f"""Role: Constitutional Law Expert.
Task: Classify the Thai Constitution Section into EXACTLY ONE category.

Categories:
{categories_str}

Logic for Ambiguity:
- If the section is explicitly in "Transitory Provisions" (บทเฉพาะกาล), choose 'transitory'.
- If it mentions 'NCPO', 'Head of Junta', 'Revolutionary Council', choose 'coup_power'.
- If it mentions 'King', 'Privy Council', choose 'monarchy'.

Output Format: Return ONLY the Category ID string (e.g., coup_power). No explanation.
"""
        response_text = self.query_ai(system_prompt, section_content)

        # Clean response to get only the ID
        clean_id = (
            response_text.strip().replace('"', "").replace("'", "").split("\n")[0]
        )
        return clean_id


class AgentSummarizer(Agent):
    def run(self, combined_text):
        system_prompt = """Role: Political Science Professor (Specialist in Thai Constitutions).
Task: Summarize the key essence of the provided sections.
Target Audience: General public who wants to understand "Who holds the power?".

Guidelines:
1. Summarize in Thai language.
2. Focus on: Who has authority? What are the limitations?
3. Use neutral but sharp academic tone.
4. Keep it under 3-4 sentences.
5. If comparing changes, highlight what is new or removed.
"""
        return self.query_ai(
            system_prompt, combined_text, temperature=0.3
        )  # เพิ่ม Creativity นิดหน่อยสำหรับการสรุป
