import pdfplumber
import logging
import sys

# Configure logging
# FIX: ระบุ encoding='utf-8' เพื่อให้เขียน Emoji ลงไฟล์ได้โดยไม่พัง
file_handler = logging.FileHandler("pipeline.log", encoding="utf-8")
stream_handler = logging.StreamHandler(sys.stdout)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[file_handler, stream_handler],
)

def extract_text_from_pdf(pdf_path):
    """
    Extracts text from a PDF file page by page.
    """
    logging.info(f"Extracting text from: {pdf_path}")
    pages_text = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    pages_text.append(text)
                else:
                    logging.warning(f"Page {i+1} has no text.")
    except Exception as e:
        logging.error(f"Error extracting text from {pdf_path}: {e}")
        return []

    logging.info(f"Extracted {len(pages_text)} pages.")
    return pages_text

def log_error(year, context, error):
    logging.error(f"Error in Year {year}: {error} | Context: {str(context)[:100]}...")