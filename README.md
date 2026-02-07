# Job Application Agent 🤖

An autonomous AI agent built with **LangGraph**, **LangChain**, and **Playwright** that automates the job application process with a human-in-the-loop workflow via a modern web interface.

## 🎯 Features

-   **📄 Resume Parsing**: Extracts structured data from PDF and DOCX resumes using intelligent parsing
-   **🔍 Smart Job Search**: Finds relevant jobs using pluggable search providers (WeWorkRemotely, Indeed, custom APIs)
-   **🎯 Fit Analysis**: Uses LLMs (OpenAI/Perplexity) to score job fit based on skills and experience
-   **✍️ Document Tailoring**: Generates tailored resume and cover letter for each specific opportunity
-   **🤖 Automated Submission**: Uses Playwright to navigate application pages and auto-fill forms
-   **👤 Human-in-the-Loop**: Interactive approval interface before submitting applications
-   **🌐 Web Interface**: Beautiful React frontend for reviewing and approving job applications
-   **📊 Application Tracking**: SQLite database tracks all applications with status and history

## 🛠 Tech Stack

### Backend
-   **Python 3.10+** - Core language
-   **FastAPI** - REST API server for the agent
-   **LangGraph** - State machine orchestration
-   **LangChain** - LLM interactions and tooling
-   **Playwright** - Browser automation for job applications
-   **Pydantic** - Data validation and modeling
-   **SQLite** - Application tracking database

### Frontend
-   **React 18** - UI framework
-   **Vite** - Build tool and dev server
-   **TailwindCSS** - Utility-first CSS styling

## 📦 Installation

### Prerequisites
- Python 3.10 or higher
- Node.js 16 or higher
- npm or yarn

### Setup Steps

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
    
    Copy the example env file:
    ```bash
    cp .env.example .env
    ```
    
    Edit `.env` with your configuration:
    ```env
    # LLM Configuration
    OPENAI_API_KEY=your_openai_key_here
    
    # Optional: Use Perplexity AI instead of OpenAI
    # OPENAI_API_BASE=https://api.perplexity.ai
    # MODEL_NAME=sonar-pro
    
    # Or use OpenAI models
    MODEL_NAME=gpt-4o
    
    # Resume path (optional, defaults to resume.pdf in project root)
    RESUME_PATH=./resume.pdf
    
    # Search Configuration (optional)
    MAX_JOBS=10
    MIN_MATCH_SCORE=70
    ```

## 🚀 Usage

### Option 1: Web Interface (Recommended)

1.  **Start the FastAPI backend** (Terminal 1):
    ```bash
    python -m src.api
    ```
    The API will be available at `http://localhost:8000`
    
    You can access the API docs at `http://localhost:8000/docs`

2.  **Start the React frontend** (Terminal 2):
    ```bash
    cd frontend
    npm run dev
    ```
    The UI will be available at `http://localhost:5173`

3.  **Use the web interface**:
    - Configure search preferences (role, location, job type)
    - Click "Start New Application" to begin the search
    - View pending job applications
    - Review tailored cover letters and resumes
    - Approve or reject applications
    - Track application status in the history

### Option 2: CLI Mode

Run the agent directly from the command line:

```bash
python src/main.py
```

The agent will:
1.  Look for `resume.pdf` (or use a mock if missing)
2.  Search for jobs matching your criteria
3.  Analyze fit and generate tailored documents
4.  **PAUSE** and ask for your approval in the terminal
5.  Proceed to apply in headed browser mode upon approval

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/start` | Start the job application agent with search preferences |
| `GET` | `/pending` | Get pending applications awaiting approval |
| `POST` | `/approve/{application_id}` | Approve an application for submission |
| `POST` | `/reject/{application_id}` | Reject an application |
| `GET` | `/history` | Get complete application history |
| `GET` | `/docs` | Interactive API documentation (Swagger UI) |

### Example API Usage

```bash
# Start a new search
curl -X POST http://localhost:8000/start \
  -H "Content-Type: application/json" \
  -d '{"role": "Software Engineer", "location": "Remote", "job_type": "full-time"}'

# Get pending applications
curl http://localhost:8000/pending

# Approve an application
curl -X POST http://localhost:8000/approve/123
```

## 🗂 Project Structure

```
apply_agent/
├── src/
│   ├── api.py              # FastAPI server and endpoints
│   ├── config.py           # Configuration management
│   ├── database.py         # SQLite database operations
│   ├── graph.py            # LangGraph workflow definition
│   ├── models.py           # Pydantic data models
│   ├── state.py            # Agent state definition
│   ├── main.py             # CLI entry point
│   ├── modules/            # Core business logic
│   │   ├── parser.py       # Resume parsing
│   │   ├── search.py       # Job search implementations
│   │   ├── analyzer.py     # Job fit analysis
│   │   ├── generator.py    # Cover letter generation
│   │   └── browser.py      # Playwright automation
│   └── nodes/              # LangGraph node implementations
│       ├── ingestion.py    # Resume ingestion node
│       ├── search.py       # Job search node
│       ├── analysis.py     # Fit analysis node
│       ├── tailoring.py    # Document tailoring node
│       └── action.py       # Application submission node
├── frontend/               # React web application
│   ├── src/
│   │   ├── App.jsx         # Main UI component
│   │   └── index.css       # TailwindCSS styles
│   ├── package.json
│   └── vite.config.js
├── pyproject.toml          # Python dependencies
├── resume.pdf              # Your resume (place here)
├── .env                    # Environment variables (not in git)
├── .env.example            # Example environment config
└── applications.db         # SQLite database (auto-created)
```

## 🔧 Configuration

### Job Search Providers

The agent supports multiple job search providers:

- **WeWorkRemotely**: Remote job listings (default)
- **Indeed**: General job search
- **Mock Provider**: For testing without API calls

You can configure the provider in `src/modules/search.py`.

### LLM Providers

Supported LLM providers:
- **OpenAI**: GPT-4, GPT-4o, GPT-3.5-turbo
- **Perplexity AI**: sonar-pro, sonar-reasoning
- Any OpenAI-compatible API

Configure via environment variables in `.env`.

## 🐛 Troubleshooting

### Common Issues

#### 1. Playwright Browser Not Found
```bash
Error: Executable doesn't exist at /path/to/chromium
```
**Solution**: Install Playwright browsers
```bash
python -m playwright install chromium
```

#### 2. Port Already in Use
```bash
Error: Address already in use (port 8000)
```
**Solution**: Kill the existing process or use a different port
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use a different port
uvicorn src.api:app --port 8001
```

#### 3. Frontend Can't Connect to Backend
```bash
Failed to fetch from http://localhost:8000
```
**Solution**: Ensure backend is running and CORS is configured
- Check if `python -m src.api` is running
- Verify the API URL in `frontend/src/App.jsx`

#### 4. Resume Not Found
```bash
Warning: resume.pdf not found, using mock data
```
**Solution**: Place your resume in the project root or update `RESUME_PATH` in `.env`
```bash
cp ~/path/to/your/resume.pdf ./resume.pdf
```

#### 5. Invalid API Key
```bash
Error: Invalid API key
```
**Solution**: Update your `.env` file with a valid API key
```env
OPENAI_API_KEY=sk-...your-key-here
```

### Debug Mode

Enable verbose logging:
```bash
# In .env
LOG_LEVEL=DEBUG

# Run with logging
python -m src.api --log-level debug
```

## 📝 Workflow Examples

### Example 1: Basic Job Search
```python
# Start the agent with default settings
python src/main.py
```

### Example 2: Customized Search via API
```python
import requests

# Configure search
payload = {
    "role": "Senior React Developer",
    "location": "Remote",
    "job_type": "full-time",
    "date_posted": "week"
}

# Start search
response = requests.post("http://localhost:8000/start", json=payload)
print(f"Search started: {response.json()}")

# Get pending applications
pending = requests.get("http://localhost:8000/pending").json()
print(f"Found {len(pending)} jobs to review")

# Approve first application
if pending:
    app_id = pending[0]["id"]
    requests.post(f"http://localhost:8000/approve/{app_id}")
    print(f"Approved application {app_id}")
```

### Example 3: Batch Processing
```bash
# Process multiple applications in CLI mode
python src/main.py --max-jobs 20 --auto-approve-threshold 85
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1.  **Fork the repository**
2.  **Create a feature branch**:
    ```bash
    git checkout -b feature/your-feature-name
    ```
3.  **Make your changes** and commit:
    ```bash
    git add .
    git commit -m "Add your feature description"
    ```
4.  **Push to your fork**:
    ```bash
    git push origin feature/your-feature-name
    ```
5.  **Submit a Pull Request**

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint for JavaScript/React code
- Add tests for new features
- Update documentation as needed

## 📄 License

[MIT](LICENSE)


