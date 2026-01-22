import os
import time
import json  # Ensure json is imported
from pymongo import MongoClient
from config import MONGO_URI, DB_NAME, CATEGORIES
from utils import log_error  # Removed extract_text_from_pdf as we use Gemini now
from gemini_processor import process_pdf_with_gemini
from agents import AgentSummarizer
import logging

# Initialize DB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Initialize Agents
agent_summarizer = AgentSummarizer()


def process_constitution(year, pdf_path):
    logging.info(f"🚀 Processing Year: {year} using Google Gemini Native OCR")

    if not os.path.exists(pdf_path):
        logging.error(f"File not found: {pdf_path}")
        return

    try:
        # Step 1: Process entire PDF with Gemini
        extracted_data = process_pdf_with_gemini(pdf_path)

        # Gemini returns a list of objects directly
        all_sections = (
            extracted_data
            if isinstance(extracted_data, list)
            else extracted_data.get("sections", [])
        )

        logging.info(f"Found {len(all_sections)} sections via Gemini. Saving to DB...")

        # Step 2: Save to DB
        for section in all_sections:
            try:
                # Basic validation/defaulting
                category_id = section.get("category_id", "uncategorized")
                if category_id not in CATEGORIES:
                    category_id = "uncategorized"

                section_doc = {
                    "_id": f"{year}_sec_{section.get('section_number')}",
                    "constitution_year": year,
                    "section_number": section.get("section_number"),
                    "content": section.get("content"),
                    "category_id": category_id,
                    "raw_content": section.get("content"),
                }

                # Upsert to DB
                db.sections.replace_one(
                    {"_id": section_doc["_id"]}, section_doc, upsert=True
                )
                logging.info(
                    f"Saved Section {section.get('section_number')} -> {category_id}"
                )

            except Exception as e:
                log_error(year, f"Section {section.get('section_number')}", e)

        # DEBUG: Save all sections to JSON for visual inspection
        debug_filename = f"debug_sections_{year}_gemini.json"
        with open(debug_filename, "w", encoding="utf-8") as f:
            json.dump(all_sections, f, ensure_ascii=False, indent=2)
        logging.info(f"💾 Saved debug output to {debug_filename}")

        logging.info(f"✅ Finished Processing Year: {year}")

    except Exception as e:
        logging.error(f"Critical Pipeline Error: {e}")


def generate_summaries(year):
    logging.info(f"📝 Generating Summaries for Year: {year}")

    for cat_id in CATEGORIES:
        sections = list(
            db.sections.find({"constitution_year": year, "category_id": cat_id})
        )
        if not sections:
            continue

        combined_text = "\n".join([s["content"] for s in sections])

        try:
            summary = agent_summarizer.run(combined_text)

            summary_doc = {
                "constitution_year": year,
                "category_id": cat_id,
                "ai_summary": summary,
                "section_refs": [s["_id"] for s in sections],
            }

            # Upsert Summary
            db.summaries.replace_one(
                {"constitution_year": year, "category_id": cat_id},
                summary_doc,
                upsert=True,
            )
            logging.info(f"Summarized {cat_id}")
            time.sleep(1)

        except Exception as e:
            log_error(year, f"Summary {cat_id}", e)


if __name__ == "__main__":
    import sys
    import glob

    # Check for GOOGLE_API_KEY
    if not os.getenv("GOOGLE_API_KEY"):
        logging.error(
            "CRITICAL: GOOGLE_API_KEY not found in environment variables. Please set it in .env file."
        )
        exit(1)

    target_year = 2560  # Default year, can be made dynamic
    target_pdf = None

    # 1. Try to get from arguments
    if len(sys.argv) > 1:
        target_pdf = sys.argv[1]

    # 2. If not provided, try to find the first PDF in the directory
    if not target_pdf:
        pdfs = glob.glob("*.pdf")
        if pdfs:
            target_pdf = pdfs[0]
            logging.info(f"Auto-detected PDF: {target_pdf}")
        else:
            logging.error(
                "No PDF file found in directory. Please place a .pdf file here or provide path as argument."
            )
            exit(1)

    # Run Process
    process_constitution(target_year, target_pdf)

    # Generate Summaries (Now enabled using Gemini 1.5 Pro)
    generate_summaries(target_year)

    print(f"\n✅ Pilot Test Complete for {target_pdf}")
    print("Check 'pipeline.log' and MongoDB for results.")
