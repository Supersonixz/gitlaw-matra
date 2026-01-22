import pdfplumber
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("pipeline.log"), logging.StreamHandler()],
)


def extract_text_from_pdf(pdf_path):
    """
    Extracts text from a PDF file page by page.
    Returns a list of strings, where each string is the text of a page.
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
    """
    Logs an error with specific context.
    """
    logging.error(f"Error in Year {year}: {error} | Context: {str(context)[:100]}...")
