# PreAuthIQ — Assignment Deliverables

This document maps the recruiter’s requested deliverables to this repository.

**Short README (approach, prompt/skill design, assumptions, limitations, possible improvements):** [SUBMISSION.md](../SUBMISSION.md)

## Live demo

| Component | URL |
|-----------|-----|
| **GitHub** | [github.com/Anurag260704/PreAuthIQ](https://github.com/Anurag260704/PreAuthIQ) |
| **Frontend** | [https://pre-auth-iq.vercel.app](https://pre-auth-iq.vercel.app) |
| **Backend API** | [https://preauthiq.onrender.com](https://preauthiq.onrender.com) |
| **API docs (Swagger)** | [https://preauthiq.onrender.com/docs](https://preauthiq.onrender.com/docs) |

---

## 1. GitHub repository

Full monorepo: `backend/` (FastAPI + skill pipeline), `frontend/` (Next.js), `docs/`, tests, and CI workflows.

**Quick clone & run:** see [README.md](../README.md#local-setup).

---

## 2. Backend API to test the skill

The skill is exposed as a versioned REST API under `/api/v1`.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/status` | GET | Health check (used by uptime monitor) |
| `/api/v1/samples` | GET | List training cases from workbook JSON |
| `/api/v1/review` | POST | Run full 4-step pipeline on structured `PreAuthCaseInput` |
| `/api/v1/review/upload` | POST | Upload `.xlsx` workbook or run complex-case sheet |

**Example — complex case (PA-001) via API:**

```bash
# 1) Fetch structured input for PA-001
curl "https://preauthiq.onrender.com/api/v1/samples/complex" -o case.json

# 2) Run the skill (add -H "X-API-Key: ..." if API_KEY is set on Render)
curl -X POST "https://preauthiq.onrender.com/api/v1/review" \
  -H "Content-Type: application/json" \
  -d @case.json
```

**Local (with `MISTRAL_API_KEY` in `backend/.env`):**

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Then open http://localhost:8000/docs
```

**Regenerate complex-case output (D4 artifact):**

```bash
cd backend
python scripts/run_complex_case.py
# Writes outputs/complex_case_output.json and docs/examples/complex_case_output.json
```

---

## 3. Frontend — upload / select case / view output

| Route | What it does |
|-------|----------------|
| `/` | Landing — product overview |
| `/dashboard` | Select a **training case** from the workbook table and run review |
| `/review` | **Manual form** or **`.xlsx` upload** (Complex_Case_Input or Training_Cases sheets) |
| `/result` | Reviewer report — recommendation, criteria table, evidence, gaps, provider query |
| `/user-guide` | Field glossary aligned to the 35-field input schema |

**Typical flows:**

1. **Training case:** Dashboard → pick case → Run → `/result`
2. **Complex case:** Review → upload assignment workbook (or use preloaded PA-001 data) → `/result`
3. **Custom packet:** Review → paste raw notes / fill fields → Submit → `/result`

---

## 4. Example output — complex case (PA-001)

**Input:** `backend/data/complex_case.json` (19-row cervical myelopathy / spine surgery packet)

**Committed example output (Mistral `mistral-large-latest`, May 2026):**

- [`docs/examples/complex_case_output.json`](examples/complex_case_output.json)

**Expected rubric (assignment sheet):** `backend/data/expected_outcome.json`

| Field | Expected |
|-------|----------|
| `recommendation` | `NEED_MORE_INFO` |
| Core criteria C1–C3 | `MET` |
| Secondary C4–C6 | `PARTIAL` |
| `appeal_direction` | `null` (not a deny) |
| `flip_condition` | Populated — what documentation would move toward approve |

The example JSON matches this rubric: clinical necessity is supported, but the **latest surgeon note** lacks explicit ADL and inpatient site-of-care wording, so the skill returns **pend-for-documentation** rather than deny.

---

## 5–9. Design narrative

See **[SUBMISSION.md](../SUBMISSION.md)** for:

- Approach  
- Prompt / skill design  
- Assumptions  
- Limitations  
- Possible improvements  

---

## 10. Testing & CI

- **Backend:** `pytest` in `backend/tests/` (engine, assembly, criteria routing, complex scenario).
- **Frontend:** `npm run typecheck` + `npm run build` in CI.
- **Uptime:** `.github/workflows/uptime-monitor.yml` pings Render + Vercel every 10 minutes.

See [development-guide.md](development-guide.md) for contributor setup.
