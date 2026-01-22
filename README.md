# Thai Constitution Semantic Engine Pipeline

This project processes Thai Constitution PDF files into a structured MongoDB database using Python and Google Agents.

## Prerequisites

- Python 3.8+
- MongoDB (Running locally or hosted)
- Google API Key

## Setup

1.  **Create and Activate Virtual Environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

2.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory:
    ```env
    GOOGLE_API_KEY=your_google_api_key
    MONGO_URI=mongodb://localhost:27017/
    ```

## Usage

1.  Place your PDF files in the project directory (e.g., `constitution_2560.pdf`).
2.  Edit `main.py` to target your specific PDF file and Year:
    ```python
    if __name__ == "__main__":
        process_constitution(2560, "constitution_2560.pdf")
    ```
3.  Run the pipeline:
    ```bash
    # Ensure venv is activated
    python main.py
    ```

## Structure

- `main.py`: Orchestrator script.
- `agents.py`: AI Agent logic (Cleaner, Classifier, Summarizer).
- `utils.py`: PDF extraction utilities.
- `config.py`: Configuration and Category definitions.
