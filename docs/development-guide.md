# Development Guide

## Prerequisites

- Python 3.10+
- Node.js 18+
- `MISTRAL_API_KEY` in backend runtime environment

## Local Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

cd ../frontend
npm install
```

## Run Services

```bash
cd backend
uvicorn main:app --reload --port 8000
```

```bash
cd frontend
npm run dev
```

## Parse Workbook Data

```bash
cd backend
python scripts/parse_workbook.py --input data/preauth_workbook.xlsx --output data/
```

## Execute Core Scenarios

```bash
cd backend
python scripts/run_complex_case.py
pytest tests -v
```

## Frontend Workflow

- `/` dashboard and sample browser
- `/review` intake form and upload workflow
- `/report` reviewer report with export and history

## Quality Checks

- Backend tests: `pytest backend/tests -v`
- Frontend type check: `npm run typecheck`
- Frontend build: `npm run build`
