import logging
import time
import google.generativeai as genai
from config import GOOGLE_API_KEY, CATEGORIES

# Set up Google API (Using the same key as for PDF processing)
if not GOOGLE_API_KEY:
    logging.warning("GOOGLE_API_KEY is not set.")
else:
    genai.configure(api_key=GOOGLE_API_KEY)


class AgentSummarizer:
    def __init__(self):
        # Switch to Gemini 1.5 Pro (Smarter model) for reasoning tasks
        self.model = genai.GenerativeModel("gemini-1.5-pro")

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
        try:
            # Send Prompt
            response = self.model.generate_content(
                f"{system_prompt}\n\nContent to analyze:\n{combined_text}"
            )
            return response.text
        except Exception as e:
            logging.error(f"Gemini Summarize Error: {e}")
            return "ไม่สามารถสรุปได้ (AI Error)"


# Other agents (Cleaner, Classifier) are removed as their tasks are handled by the main pipeline (gemini_processor).
