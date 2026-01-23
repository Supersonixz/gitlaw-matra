import os
import time
import json
import logging
from google import genai
from google.genai import types
from config import GOOGLE_API_KEY


def process_pdf_with_gemini(pdf_path):
    if not GOOGLE_API_KEY:
        logging.error("CRITICAL: GOOGLE_API_KEY not found via config.")
        raise ValueError("Google API Key missing.")

    client = genai.Client(api_key=GOOGLE_API_KEY)

    logging.info(f"📤 Uploading {pdf_path} to Gemini...")

    try:
        # Upload file
        # google-genai v1 uploads directly
        with open(pdf_path, "rb") as f:
            sample_file = client.files.upload(
                file=f,
                config=types.UploadFileConfig(
                    display_name="Constitution Doc",
                    mime_type="application/pdf"
                )
            )

        # Wait for processing
        while sample_file.state.name == "PROCESSING":
            logging.info("⏳ Waiting for file processing on Google Server...")
            time.sleep(2)
            sample_file = client.files.get(name=sample_file.name)

        if sample_file.state.name == "FAILED":
            raise ValueError("File upload/processing failed on Google side.")

        logging.info("✅ File processed! Asking Gemini to extract data...")

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

        # Retry Logic for Rate Limits
        max_retries = 5
        base_delay = 10  # Seconds
        
        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=[sample_file, prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    ),
                )
                
                # Cleanup
                client.files.delete(name=sample_file.name)
                
                return json.loads(response.text)

            except Exception as e:
                # Check for rate limit errors (often 429)
                error_str = str(e)
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                    wait_time = base_delay * (2 ** attempt)
                    logging.warning(f"⚠️ Rate limit hit. Retrying in {wait_time}s... (Attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                else:
                    # Non-retryable error
                    raise e
        
        raise RuntimeError("Max retries exceeded for Gemini API.")

    except Exception as e:
        logging.error(f"Gemini Processing Error: {e}")
        # Attempt minimal cleanup if reference exists
        try:
            if 'sample_file' in locals():
                 client.files.delete(name=sample_file.name)
        except:
            pass
        raise e
