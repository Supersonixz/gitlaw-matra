import os
import time
import json
import logging
import google.generativeai as genai
from config import GOOGLE_API_KEY


def process_pdf_with_gemini(pdf_path):
    if not GOOGLE_API_KEY:
        logging.error("CRITICAL: GOOGLE_API_KEY not found via config.")
        raise ValueError("Google API Key missing.")

    genai.configure(api_key=GOOGLE_API_KEY)

    logging.info(f"📤 Uploading {pdf_path} to Gemini...")

    try:
        # Upload file (Temporary)
        sample_file = genai.upload_file(path=pdf_path, display_name="Constitution Doc")

        # Wait for processing
        while sample_file.state.name == "PROCESSING":
            logging.info("⏳ Waiting for file processing on Google Server...")
            time.sleep(2)
            sample_file = genai.get_file(sample_file.name)

        if sample_file.state.name == "FAILED":
            raise ValueError("File upload/processing failed on Google side.")

        logging.info("✅ File processed! Asking Gemini to extract data...")

        # Model Selection
        model = genai.GenerativeModel(model_name="gemini-1.5-flash")

        # Prompt
        prompt = """
        Role: Thai Legal Document Specialist.
        Task: Extract data from this PDF into a JSON structure.
        
        Instructions:
        1. Read the entire document (OCR is handled automatically).
        2. Ignore page numbers, headers, and footers.
        3. Fix broken lines and spacing issues automatically.
        4. Extract each 'Section' (มาตรา) and classify its category immediately.
        
        Categories to classify (based on context):
        [preamble, general, monarchy, rights_duties, state_policies, reform, legislative, executive, judicial, conflict_interest, independent_orgs, const_court, ethics, local_admin, amendment, coup_power, final_provisions, transitory]

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

        # Generate Content
        response = model.generate_content(
            [sample_file, prompt],
            generation_config={"response_mime_type": "application/json"},
        )

        # Cleanup
        genai.delete_file(sample_file.name)

        return json.loads(response.text)

    except Exception as e:
        logging.error(f"Gemini Processing Error: {e}")
        raise e
