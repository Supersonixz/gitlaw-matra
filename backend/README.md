# Matra Backend Pipeline

The backend engine for **Matra**, responsible for digitizing, processing, and analyzing Thai Constitution PDF files into machine-readable JSON formats.

## Pipeline Overview

The pipeline consists of two main stages:

### 1. OCR & Cleanup (`01_ocr_extraction.py`)
- **Input**: Raw PDF/Images of constitutions.
- **Process**:
  - Extracts text using **Typhoon OCR** (via API) or legacy data.
  - **Smart Heal Sequence**: Automatically detects and fixes missing or out-of-order section numbers.
  - **Legacy Comparison**: Verifies OCR accuracy against existing datasets (if available).
- **Output**: Cleaned raw JSON data.

### 2. AI Analysis & Categorization (`02_ai_analysis.py`)
- **Input**: Cleaned JSON from Step 1.
- **Process**:
  - **Smart Mapping**: Uses **Gemma-3-27b-it** (via Google GenAI SDK) to semantically map archaic/historical headers (e.g., "พฤฒสภา") to modern categories (e.g., "Legislative").
  - **Categorization**: Groups sections into standard categories (Monarchy, Executive, Rights, etc.).
  - **Summarization**: Generates concise summaries and identifies "Key Changes" for each category.
- **Output**: Final structured JSON ready for the frontend.

---

## Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   # Required for OCR
   TYPHOON_OCR_API_KEY=your_typhoon_key

   # Required for AI Analysis & Mapping
   GOOGLE_API_KEY=your_google_ai_key
   OPENROUTER_API_KEY=your_openrouter_key # (If applicable)
   ```

## Running the Pipeline

### Step 1: Extract & Clean
Target a specific constitution ID (configured in `config.py`):

```bash
python 01_ocr_extraction.py
```
*This will generate intermediate checkpoints in `json_output/`.*

### Step 2: Analyze & Summarize
Once extraction is complete, run the analysis:

```bash
python 02_ai_analysis.py
```
*This produces the final `final_summary.json` used by the web app.*

## Project Structure

- `01_ocr_extraction.py`: Core OCR logic and sequence healing.
- `02_ai_analysis.py`: AI-driven categorization and summarization.
- `agents.py`: Helpers for interacting with AI models.
- `config.py`: Central configuration for API keys, folder paths, and categories.
- `merger.py`: Utility for merging OCR batches.
