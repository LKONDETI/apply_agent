# Job Application Agent 🤖

An autonomous AI agent built with **LangGraph**, **LangChain**, and **Playwright** that automates the job application process with a human-in-the-loop workflow via a modern web interface.

## Features

-   **Resume Parsing**: Extracts structured data from PDF and DOCX resumes.
-   **Smart Job Search**: Finds relevant jobs using pluggable search providers (Mock, APIs, etc.).
-   **Fit Analysis**: Uses LLMs (OpenAI/Perplexity) to score job fit based on skills and experience.
-   **Document Tailoring**: Generates tailored resume and cover letter for each specific opportunity.
-   **Automated Submission**: Uses Playwright to navigate application pages (Concept/Mock).
-   **Human-in-the-Loop**: Interactive approval interface before submitting applications.
-   **Web Interface**: React frontend for reviewing and approving job applications.

## Tech Stack

### Backend
-   **Python 3.10+**
-   **FastAPI**: REST API server for the agent
-   **LangGraph**: State machine orchestration
-   **LangChain**: LLM interactions
-   **Playwright**: Browser automation
-   **Pydantic**: Data validation and modeling
-   **SQLite**: Application tracking database

### Frontend
-   **React 18**: UI framework
-   **Vite**: Build tool and dev server
-   **TailwindCSS**: Styling

## Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/LKONDETI/apply_agent.git
    cd apply_agent
    ```

2.  **Install Python dependencies**:
    ```bash
    pip install .
    python -m playwright install chromium
    ```

3.  **Install Frontend dependencies**:
    ```bash
    cd frontend
    npm install
    cd ..
    ```

4.  **Configure Environment**:
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

### Option 1: Web Interface (Recommended)

1.  **Start the FastAPI backend**:
    ```bash
    python -m src.api
    ```
    The API will be available at `http://localhost:8000`

2.  **Start the React frontend** (in a new terminal):
    ```bash
    cd frontend
    npm run dev
    ```
    The UI will be available at `http://localhost:5173`

3.  **Use the web interface**:
    - View pending job applications
    - Review tailored cover letters and resumes
    - Approve or reject applications
    - Track application status

### Option 2: CLI Mode

Run the agent directly:

```bash
python src/main.py
```

The agent will:
1.  Look for `resume.pdf` (or use a mock if missing).
2.  Search for jobs.
3.  Analyze fit and generate tailored documents.
4.  **PAUSE** and ask for your verification in the terminal.
5.  Proceed to apply (in Headed browser mode) upon approval.

## API Endpoints

- `POST /start` - Start the job application agent
- `GET /pending` - Get pending applications awaiting approval
- `POST /approve/{application_id}` - Approve an application
- `POST /reject/{application_id}` - Reject an application
- `GET /history` - Get application history

## Project Structure

```
├── src/
│   ├── api.py         # FastAPI server
│   ├── modules/       # Core logic (parser, search, analyzer, etc.)
│   ├── nodes/         # LangGraph nodes
│   ├── graph.py       # Graph definition
│   ├── models.py      # Pydantic data models
│   ├── state.py       # Agent state definition
│   ├── database.py    # SQLite database operations
│   └── main.py        # CLI entry point
├── frontend/          # React application
│   ├── src/
│   │   └── App.jsx    # Main UI component
│   └── package.json
├── pyproject.toml     # Python dependencies
└── applications.db    # SQLite database for tracking
```

## Contributing

1.  Fork the repo.
2.  Create a feature branch.
3.  Submit a Pull Request.

## License

[MIT](LICENSE)
