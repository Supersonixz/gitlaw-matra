import logging
import time
import re
import json
from google import genai
from google.genai import types
from config import GOOGLE_API_KEY, CATEGORIES

# Set up Google API
if not GOOGLE_API_KEY:
    logging.warning("GOOGLE_API_KEY is not set.")
    client = None
else:
    client = genai.Client(api_key=GOOGLE_API_KEY)


class AgentSummarizer:
    def __init__(self):
        # Switch to Gemini 1.5 Pro (Smarter model) for reasoning tasks
        # Or 2.5-flash if preferred for speed/cost
        self.model_name = "gemini-2.5-flash"

    def _clean_json_response(self, text):
        """Helper: พยายามแกะ JSON ออกจากข้อความขยะ หรือ Markdown"""
        clean_text = text.strip()
        # 1. ถอด Markdown Code Block
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]

        # 2. ลอง Parse ตรงๆ
        try:
            return json.loads(clean_text.strip())
        except json.JSONDecodeError:
            pass

        # 3. ใช้ Regex ค้นหา {...} (ท่าไม้ตาย)
        try:
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
        except Exception as e:
            logging.warning(f"JSON Parsing failed: {e}")

        return {}

    def run_batch(self, grouped_content_dict):
        if not client:
            return {}

        content_json_str = json.dumps(
            grouped_content_dict, ensure_ascii=False, indent=2
        )
        target_cats = list(CATEGORIES.keys())

        system_prompt = f"""
        Role: Political Science Professor (Thai Constitution Specialist).
        Task: Analyze the provided constitution content (grouped by categories) and summarize EACH category.
        
        Target Categories: {target_cats}

        Input Format: A JSON object where keys are category IDs and values are lists of sections.
        
        Output Requirement:
        Return a SINGLE JSON object where:
        - Key = category_id (must match input keys exactly)
        - Value = An object containing:
            - "summary": (String) Summary in Thai (neutral, academic, max 3 sentences).
            - "key_change": (String) A short highlight of power dynamics or significant changes.
        
        Constraint: Strictly Output valid JSON only. No markdown.
        """

        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model=self.model_name,
                    contents=[
                        system_prompt,
                        f"[DATA START]\n{content_json_str}\n[DATA END]",
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    ),
                )

                # เรียกใช้ Helper ที่เราเตรียมไว้
                result = self._clean_json_response(response.text)

                if result:
                    return result
                else:
                    logging.warning(
                        f"⚠️ Empty/Invalid JSON from AI (Attempt {attempt+1})"
                    )
                    time.sleep(2)

            except Exception as e:
                logging.warning(f"⚠️ Batch Summary Error (Attempt {attempt+1}): {e}")
                time.sleep(5)

        logging.error("❌ Failed to generate batch summary after retries.")
        return {}
