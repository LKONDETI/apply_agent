# Job Application Agent 🤖

An autonomous AI agent built with **LangGraph**, **LangChain**, and **Playwright** that automates the job application process with a human-in-the-loop workflow.

## Features

-   **Resume Parsing**: Extracts structured data from PDF and DOCX resumes.
-   **Smart Job Search**: Finds relevant jobs using pluggable search providers (Mock, APIs, etc.).
-   **Fit Analysis**: Uses LLMs (OpenAI/Perplexity) to score job fit based on skills and experience.
-   **Tailoring**: clear Generates a tailored resume and cover letter for each specific opportunity.
-   **Automated Submission**: Uses Playwright to navigate application pages (Concept/Mock).
-   **Human-in-the-Loop**: Pauses for user approval before submitting any application.

## Tech Stack

-   **Python 3.10+**
-   **LangGraph**: State machine orchestration.
-   **LangChain**: LLM interactions.
-   **Playwright**: Browser automation.
-   **Pydantic**: Data validation and modeling.

## Installation

1.  **Clone the repository** (or just enter the directory):
    ```bash
    cd apply_agent
    ```

2.  **Install dependencies**:
    ```bash
    pip install .
    python -m playwright install chromium
    ```

3.  **Configure Environment**:
    Copy the example env file and add your API keys.
    ```bash
    cp .env.example .env
    ```
    Edit `.env`:
    ```env
    OPENAI_API_KEY=your_key_here
    OPENAI_API_BASE=https://api.perplexity.ai # Optional: Use Perplexity or other providers
    MODEL_NAME=sonar-pro # or gpt-4o
    ```

## Usage

Run the agent:

```bash
python src/main.py
```

The agent will:
1.  Look for `resume.pdf` (or use a mock if missing).
2.  Search for jobs.
3.  Analyze fit and generate tailored documents.
4.  **PAUSE** and ask for your verification.
5.  Proceed to apply (in Headed browser mode) upon approval.

## Project Structure

```
├── src/
│   ├── modules/       # Core logic (parser, search, analyzer, etc.)
│   ├── nodes/         # LangGraph nodes
│   ├── graph.py       # Graph definition
│   ├── models.py      # Pydantic data models
│   ├── state.py       # Agent state definition
│   └── main.py        # Entry point
├── pyproject.toml     # Dependencies
└── applications.db    # (Upcoming) Database for tracking
```

## Contributing

1.  Fork the repo.
2.  Create a feature branch.
3.  Submit a Pull Request.

## License

[MIT](LICENSE)
