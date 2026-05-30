# PreAuthIQ — Prior Authorization Copilot

PreAuthIQ is an AI-powered clinical prior authorization review platform. It reads a patient case packet, runs it through a structured 4-step pipeline using Mistral LLM, and produces a reviewer-ready decision with full evidence attribution, documentation gap analysis, and QA audit scores.

## Assignment deliverables (recruiter checklist)

| Deliverable | Location |
|-------------|----------|
| GitHub repository | This repo — [github.com/Anurag260704/PreAuthIQ](https://github.com/Anurag260704/PreAuthIQ) |
| Backend API to test the skill | [https://preauthiq.onrender.com/docs](https://preauthiq.onrender.com/docs) — `POST /api/v1/review`, `POST /api/v1/review/upload` |
| Frontend (select / upload case, view output) | [https://pre-auth-iq.vercel.app](https://pre-auth-iq.vercel.app) — `/dashboard`, `/review`, `/result` |
| Example output — complex case (PA-001) | [`docs/examples/complex_case_output.json`](docs/examples/complex_case_output.json) |
| Short README: approach, prompts, assumptions, limits, improvements | [`SUBMISSION.md`](SUBMISSION.md) |

**Short submission narrative:** [SUBMISSION.md](SUBMISSION.md) · **Full deliverables map:** [docs/ASSIGNMENT.md](docs/ASSIGNMENT.md)

---

## Table of Contents

0. [Assignment deliverables](#assignment-deliverables-recruiter-checklist)
1. [What It Does](#what-it-does)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Local Setup](#local-setup)
6. [Environment Variables](#environment-variables)
7. [The 4-Step Pipeline](#the-4-step-pipeline)
8. [Input Schema (35 Fields)](#input-schema-35-fields)
9. [Output Schema](#output-schema)
10. [Criteria Registry (7 Service Types)](#criteria-registry-7-service-types)
11. [Recommendation Decision Logic](#recommendation-decision-logic)
12. [QA Audit Scoring](#qa-audit-scoring)
13. [Appeal Packet Generation](#appeal-packet-generation)
14. [API Reference](#api-reference)
15. [Frontend Routes](#frontend-routes)
16. [Design System](#design-system)
17. [Configuration Reference](#configuration-reference)
18. [Error Types](#error-types)
19. [Security](#security)
20. [Deployment (Render)](#deployment-render)

---

## What It Does

Healthcare utilization review teams receive prior authorization requests daily. Manually reviewing each packet against payer policy criteria is slow and error-prone. PreAuthIQ automates this:

1. Accepts structured clinical data or raw notes
2. Normalizes and extracts all clinical facts (LLM Step 1)
3. Scores completeness and data quality (pure Python)
4. Evaluates each payer policy criterion against the normalized case (LLM Step 2)
5. Assembles and validates the final output (pure Python)
6. Returns a structured recommendation: `LIKELY_APPROVE`, `NEED_MORE_INFO`, or `LIKELY_DENY`

The output includes per-criterion verdicts with evidence citations, documentation gaps, a provider outreach query, QA audit scores, and an optional appeal packet.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  /dashboard  /review  /report  /user-guide                  │
└────────────────────────┬────────────────────────────────────┘
                         │  HTTP REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                           │
│                                                             │
│  POST /api/v1/review                                        │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            AuthorizationEngine (engine.py)           │   │
│  │                                                      │   │
│  │  Step 1: extract_clinical_fields()                   │   │
│  │          └─ Mistral LLM Call #1 (normalization)      │   │
│  │                                                      │   │
│  │  Step 2: validate_and_enrich_input()                 │   │
│  │          └─ Pure Python — quality score + hints      │   │
│  │          resolve_policy_rules()                      │   │
│  │          └─ criteria_registry.py keyword lookup      │   │
│  │                                                      │   │
│  │  Step 3: adjudicate_policy()                         │   │
│  │          └─ Mistral LLM Call #2 (evaluation)         │   │
│  │          compute_audit_metrics()                     │   │
│  │          └─ Pure Python — consistency / risk scores  │   │
│  │                                                      │   │
│  │  Step 4: compose_report()                            │   │
│  │          └─ assembler.py — validation + enforcement  │   │
│  └──────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│                          ▼ PreAuthSkillOutput (Pydantic)     │
└─────────────────────────────────────────────────────────────┘
```

Each step has a single responsibility. If a step fails, the error identifies exactly which stage and why — making debugging fast and reliable.

---

## Tech Stack

### Backend

| Technology | Version | Role |
|---|---|---|
| Python | 3.11+ | Runtime |
| FastAPI | 0.116.1 | Web framework |
| Uvicorn | 0.31.1 | ASGI server |
| Pydantic | 2.10.6 | Schema validation and serialization |
| Mistral AI SDK | 1.5.2 | LLM client |
| openpyxl | 3.1.5 | Excel workbook parsing |
| python-dotenv | 1.0.1 | Environment variable loading |
| pytest | 8.3.5 | Test framework |
| pytest-asyncio | 0.24.0 | Async test support |

### Frontend

| Technology | Version | Role |
|---|---|---|
| Next.js | 16.2.4 | React framework (App Router, static export) |
| React | 19.2.5 | UI library |
| TypeScript | 6.0.3 | Type safety |
| Tailwind CSS | 4.2.4 | Utility-first styling |
| Heroicons | 2.2.0 | Icon library |
| clsx + tailwind-merge | latest | Conditional class utility |

---

## Project Structure

```
pre-auth-copilot/
│
├── backend/
│   ├── main.py                    # FastAPI app bootstrap
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Environment variable template
│   ├── pytest.ini                 # Test configuration
│   │
│   ├── api/
│   │   ├── routes.py              # All API route handlers
│   │   ├── middleware.py          # CORS + request size limit
│   │   ├── dependencies.py        # FastAPI dependency injection
│   │   └── __init__.py
│   │
│   ├── core/
│   │   ├── engine.py              # Pipeline orchestrator
│   │   ├── extractor.py           # Step 1: clinical extraction
│   │   ├── validator.py           # Step 2: deterministic validation
│   │   ├── adjudicator.py         # Step 3: policy adjudication
│   │   ├── auditor.py             # Step 3b: QA audit scoring
│   │   ├── composer.py            # Step 4: report composition
│   │   ├── appeal.py              # Appeal packet generator (no LLM)
│   │   ├── models.py              # Re-exports from skill/schema.py
│   │   ├── policy_catalog.py      # Re-exports criteria_registry
│   │   ├── prompt_templates.py    # Re-exports skill/prompts.py
│   │   ├── providers.py           # MistralProvider + LLMProvider ABC
│   │   ├── config.py              # Runtime configuration constants
│   │   ├── exceptions.py          # Custom exception hierarchy
│   │   ├── http_client.py         # HTTP utilities
│   │   ├── response_parser.py     # Workbook row parsers
│   │   └── __init__.py
│   │
│   ├── skill/
│   │   ├── schema.py              # Pydantic models (source of truth)
│   │   ├── prompts.py             # LLM prompt templates
│   │   ├── criteria_registry.py   # Service-type → criteria mapping
│   │   ├── assembler.py           # Post-LLM validation + enforcement
│   │   ├── constants.py           # Runtime limits and model names
│   │   ├── evaluator.py           # Evaluation utilities
│   │   ├── normalizer.py          # Normalization utilities
│   │   ├── pipeline.py            # Pipeline entry points
│   │   ├── parser_utils.py        # Shared parsing helpers
│   │   ├── retry_utils.py         # LLM call retry logic
│   │   ├── errors.py              # Skill-layer error types
│   │   └── __init__.py
│   │
│   ├── data/
│   │   ├── training_cases.json    # 10 sample training cases
│   │   ├── complex_case.json      # PA-001 complex 19-row case
│   │   └── patient_data_schema.json  # Field descriptions for UI tooltips
│   │
│   └── scripts/
│       └── parse_workbook.py      # Converts Excel workbook to JSON
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (Navbar + font setup)
│   │   ├── globals.css            # Design tokens + utility classes
│   │   ├── page.tsx               # Landing page
│   │   ├── dashboard/page.tsx     # Dashboard (stats + case selector + QA table)
│   │   ├── analyze/page.tsx       # Manual case entry form
│   │   ├── review/page.tsx        # Alias → analyze/page
│   │   ├── result/page.tsx        # Report display (post-analysis)
│   │   ├── report/page.tsx        # Alias → result/page
│   │   └── user-guide/page.tsx    # Step-by-step workflow guide
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx         # Top navigation bar
│   │   │   └── Brand.tsx          # Logo component
│   │   ├── result/                # Report section components
│   │   │   ├── RecommendationBanner.tsx   # Gradient verdict hero
│   │   │   ├── ClinicalSummaryCard.tsx    # Plain prose summary
│   │   │   ├── CriteriaTable.tsx          # Timeline criteria list
│   │   │   ├── EvidencePanel.tsx          # Source pill + excerpts
│   │   │   ├── MissingInfoPanel.tsx       # Numbered gap list
│   │   │   ├── ProviderQueryBox.tsx       # Outreach blockquote
│   │   │   ├── FlipConditionBox.tsx       # What-would-flip text
│   │   │   ├── AppealDirectionBox.tsx     # Appeal text (DENY only)
│   │   │   └── ProcessingMetaFooter.tsx   # Timing + model metadata
│   │   ├── home/
│   │   │   ├── CaseSelector.tsx   # Sample case dropdown + upload
│   │   │   ├── TrainingCasesTable.tsx  # QA dataset card grid
│   │   │   └── HealthCheck.tsx    # Backend connectivity indicator
│   │   ├── form/
│   │   │   ├── FormSection.tsx    # Collapsible form group
│   │   │   ├── FieldTooltip.tsx   # Hover tooltip for field labels
│   │   │   └── RawNotesInput.tsx  # Monospace clinical notes textarea
│   │   ├── shared/
│   │   │   ├── CopyButton.tsx     # Clipboard copy with feedback
│   │   │   ├── LoadingSpinner.tsx # Step-aware loading indicator
│   │   │   └── ErrorAlert.tsx     # Error message display
│   │   └── ui/
│   │       └── Card.tsx           # Generic card wrapper
│   │
│   ├── hooks/
│   │   ├── useAnalyze.ts          # Core review state + sessionStorage
│   │   ├── useReview.ts           # Re-exports useAnalyze
│   │   └── useTheme.ts            # Dark mode toggle (html.dark class)
│   │
│   ├── lib/
│   │   ├── types.ts               # TypeScript interfaces
│   │   ├── utils.ts               # cn(), color maps, markdown builder
│   │   ├── api.ts                 # Re-exports apiClient
│   │   ├── fieldGroups.ts         # Re-exports schemaMapping
│   │   └── schemaMapping.ts       # Field name → tooltip text
│   │
│   ├── services/
│   │   └── apiClient.ts           # fetch wrapper (BASE from env)
│   │
│   └── public/
│       └── preauthiq-logo.svg     # Brand logo
│
├── docs/
│   ├── architecture.md            # System design documentation
│   ├── development-guide.md       # Developer contribution guide
│   ├── api-reference.md           # Full API documentation
│   └── CHANGELOG.md               # Version history
│
├── outputs/
│   └── case_results/
│       └── PA-001.json            # Sample output for PA-001
│
├── .cursor/
│   └── skills/
│       └── preauthiq-copilot/
│           └── SKILL.md           # Cursor agent skill for this project
│
├── AGENTS.md                      # Repository engineering standards
├── render.yaml                    # Render.com deployment config
├── pyproject.toml                 # Python project metadata
└── runtime.txt                    # Python version for Render
```

---

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Mistral AI API key](https://console.mistral.ai/)

### Backend Setup

```bash
# Navigate to the backend folder
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Mac/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env
# Edit .env and fill in your MISTRAL_API_KEY

# Start the development server
uvicorn main:app --reload --port 8000
```

Backend will be available at: `http://localhost:8000`
Interactive API docs: `http://localhost:8000/docs`

### Frontend Setup

```bash
# In a separate terminal
cd frontend

# Install dependencies
npm install

# Create local env file (if not already present)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `MISTRAL_API_KEY` | Yes | — | Mistral AI API key. Get from [console.mistral.ai](https://console.mistral.ai/) |
| `API_KEY` | No | — | Secret key for `/benchmark` endpoint. If not set, benchmark is open |
| `ALLOWED_ORIGINS` | No | `localhost:3000,3001` | Comma-separated allowed CORS origins |
| `ENVIRONMENT` | No | `development` | Set to `production` to disable localhost CORS bypass |
| `MISTRAL_MODEL` | No | `mistral-large-latest` | Primary model name |
| `MISTRAL_MODEL_CANDIDATES` | No | `mistral-large-latest,devstral-2512` | Comma-separated fallback model list |
| `MISTRAL_MAX_OUTPUT_TOKENS` | No | `4500` | Max tokens in LLM response |
| `MAX_REQUEST_BODY_BYTES` | No | `10485760` (10MB) | Max HTTP request body size |
| `MAX_UPLOAD_FILE_SIZE` | No | `52428800` (50MB) | Max Excel upload file size |
| `MAX_RAW_CLINICAL_NOTES_LENGTH` | No | `60000` | Max characters in raw_clinical_notes |
| `MAX_REQUESTED_SERVICE_LENGTH` | No | `500` | Max characters in requested_service |
| `MAX_PRIMARY_DIAGNOSIS_LENGTH` | No | `500` | Max characters in primary_diagnosis |
| `MAX_WORKBOOK_ROWS_FOR_CONTEXT` | No | `2500` | Max rows serialized from uploaded workbook |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:8000` | Backend base URL |

---

## The 4-Step Pipeline

### Step 1 — Clinical Extraction (`core/extractor.py`)

**What it does:** Sends the raw `PreAuthCaseInput` to Mistral with `NORMALIZATION_SYSTEM_PROMPT` and receives a clean structured JSON of 30 normalized fields.

**LLM behavior rules:**
- Extract only explicitly stated facts. Use `null` for absent fields — never infer.
- Note the source document type for each fact (e.g. `"PT note (discharge)"`, `"Neurology consult (recent)"`).
- If the same fact appears in multiple sources, include all separated by ` | `.
- If two sources contradict each other, write both in `contradictory_flags`.
- If `raw_clinical_notes` is provided and structured fields are sparse, extract from the raw text first.

**Post-LLM enrichment (pure Python):**
- Regex-based conservative treatment signal extraction from raw notes
- Response-to-treatment flag from keyword matching (`"failed"`, `"inadequate"`, `"worsening"`)
- Age backfill from `case_input.age` if LLM missed it

**Input:** `PreAuthCaseInput` (35 fields)
**Output:** `Dict[str, object]` — 30 normalized fields

---

### Step 2 — Validation & Criteria Resolution (`core/validator.py`, `core/policy_catalog.py`)

**Validation (pure Python, no LLM):**

Required fields checked: `requested_service`, `primary_diagnosis`

Quality score formula:
```
penalty = min(0.2 × required_issues + 0.05 × enrichment_hints, 0.9)
quality_score = max(0.1, 1.0 - penalty)
```

Enrichment hints are added when these fields are absent: `functional_impairment_adls`, `objective_neurologic_deficits`, `supporting_evidence`.

**Criteria resolution:**

Service type is determined by keyword matching against `requested_service` (first-match-wins):

```
"cervical"       → spine_surgery
"lumbar"         → spine_surgery
"fusion"         → spine_surgery
"decompression"  → spine_surgery
"home oxygen"    → dme_home_oxygen
"nocturnal"      → dme_home_oxygen
"biologic"       → biologic_therapy
"ivig"           → biologic_therapy
"rehabilitation" → post_acute_rehab
"pet/ct"         → high_cost_imaging
"pet scan"       → high_cost_imaging
"bariatric"      → bariatric_surgery
"tavr"           → cardiovascular_procedure
"valve"          → cardiovascular_procedure
(none matched)   → default (3 generic criteria)
```

**Output:** `ValidationContext` (quality_score, required_field_issues, enrichment_hints) + `List[Criterion]`

---

### Step 3 — Policy Adjudication (`core/adjudicator.py`)

**What it does:** Sends the normalized case + service-specific criteria to Mistral with `EVALUATION_SYSTEM_PROMPT_TEMPLATE` and receives a structured verdict JSON.

**LLM behavior rules (14 mandatory rules in the prompt):**
- Never invent facts. If absent, state it is absent.
- Prefer recent specialist notes over older general notes.
- Flag contradictions explicitly — never resolve them silently.
- Pain severity alone never justifies approval.
- Distinguish exactly: `MET` (well-documented) / `PARTIAL` (plausible but incomplete) / `UNMET` (clinically absent).
- PARTIAL criteria → always `NEED_MORE_INFO`, never `LIKELY_DENY`.
- High-acuity findings establish necessity even if the admin packet is incomplete.
- For C5 (site-of-care): mark `N/A` for outpatient/home/ASC. Only evaluate for inpatient/IRF/SNF.

**Output JSON from LLM:**
```json
{
  "clinical_summary": "...",
  "criteria_results": [...],
  "criteria_met": ["C1", "C2"],
  "criteria_partial_or_unmet": ["C3"],
  "supporting_evidence": [...],
  "missing_information": [...],
  "recommendation": "NEED_MORE_INFO",
  "confidence": "MEDIUM",
  "provider_query": "...",
  "appeal_direction": null,
  "flip_condition": "..."
}
```

**LLM configuration:**
- Temperature: `0.0` (deterministic — variance is a defect in medical reasoning)
- Max tokens: `4500` (complex cases can reach ~2500 tokens; lower risks mid-JSON truncation)
- Response format: `json_object` (enforced by Mistral API)
- Fallback: tries each model in `MISTRAL_MODEL_CANDIDATES` list in order if one fails

**Criteria injection:** Uses `str.replace("{criteria_block}", ...)` — **not** `.format()`. `.format()` breaks if any criterion description contains `{` or `}` characters (e.g. `SpO2 ≤88% {at rest}`).

**QA Audit Scoring (pure Python, runs after adjudication):**

Three deterministic scores computed from the adjudication result — see [QA Audit Scoring](#qa-audit-scoring) for formulas.

---

### Step 4 — Report Assembly (`skill/assembler.py`)

**What it does:** Pure Python enforcement of output constraints, cross-checks, and Pydantic validation. No LLM call.

**Enforced rules:**
- `appeal_direction = null` unless `recommendation == "LIKELY_DENY"`
- `flip_condition = null` and `provider_query = ""` when `recommendation == "LIKELY_APPROVE"`
- `criteria_met` and `criteria_partial_or_unmet` auto-corrected to match `criteria_results` statuses
- Schema hallucination fixes (e.g. LLM outputs `gap_risk` instead of `gap_or_risk`)
- Missing info list deduplicated and enriched from `case_input.missing_records` and `complications_red_flags`
- `clinical_summary` gets demographic prefix (`"58-year-old male..."`) if age/sex known but absent from summary
- Service-level overrides: specific deterministic patterns can upgrade `NEED_MORE_INFO` → `LIKELY_APPROVE` (e.g. tricompartmental OA arthroplasty with all documented conservative therapy failures)

**Raises:** `AssemblyError` (custom exception, NOT `HTTPException`) — `main.py` catches it and converts to HTTP 422 with structured debug info.

---

## Input Schema (35 Fields)

Defined in `backend/skill/schema.py` as `PreAuthCaseInput`.

### Identity (1)
| Field | Type | Required | Notes |
|---|---|---|---|
| `case_id` | `str \| null` | No | Auto-set to `"unknown"` if absent |

### Coverage (6)
| Field | Type | Required | Notes |
|---|---|---|---|
| `payer_plan` | `str \| null` | No | |
| `requested_service` | `str` | **Yes** | Drives criteria selection. Max 500 chars |
| `site_of_care` | `str \| null` | No | Inpatient/ASC/Outpatient/Home/IRF/SNF |
| `requested_los` | `str \| null` | No | Expected length of stay |
| `payer_policy_version` | `str \| null` | No | |
| `payer_policy_excerpt` | `str \| null` | No | Paste policy text; system extracts approval criteria |

### Demographics (2)
| Field | Type | Required | Notes |
|---|---|---|---|
| `age` | `int \| null` | No | |
| `sex` | `str \| null` | No | |

### Diagnosis (2)
| Field | Type | Required | Notes |
|---|---|---|---|
| `primary_diagnosis` | `str` | **Yes** | Max 500 chars |
| `secondary_diagnoses` | `List[str] \| null` | No | |

### Clinical Severity (6)
| Field | Type | Required | Notes |
|---|---|---|---|
| `symptom_duration` | `str \| null` | No | |
| `pain_severity` | `str \| null` | No | |
| `functional_impairment_adls` | `SourcedField \| null` | No | ADL data; source attribution matters for C4 |
| `objective_neurologic_deficits` | `SourcedField \| null` | No | Source matters for C2 contradiction handling |
| `vital_signs` | `str \| null` | No | |
| `mental_status` | `str \| null` | No | |

### History (3)
| Field | Type | Required | Notes |
|---|---|---|---|
| `prior_conservative_treatment` | `List[str] \| null` | No | |
| `response_to_prior_treatment` | `str \| null` | No | |
| `prior_surgeries_procedures` | `str \| null` | No | |

### Medication (2)
| Field | Type | Required | Notes |
|---|---|---|---|
| `current_medications` | `List[str] \| null` | No | |
| `medication_contraindications` | `str \| null` | No | Covers allergies + side effects + intolerances. Format: `"Allergies: [X]; Intolerances: [Y]"` |

### Diagnostics (4)
| Field | Type | Required | Notes |
|---|---|---|---|
| `imaging_findings` | `SourcedField \| null` | No | Single authoritative imaging anchor |
| `lab_results` | `str \| null` | No | |
| `pathology_biopsy` | `str \| null` | No | |
| `specialized_tests` | `str \| null` | No | EMG, PFT, oximetry, polysomnography |

### Utilization (2)
| Field | Type | Required | Notes |
|---|---|---|---|
| `prior_hospitalizations_ed` | `str \| null` | No | |
| `complications_red_flags` | `str \| null` | No | |

### Administrative (5)
| Field | Type | Required | Notes |
|---|---|---|---|
| `ordering_provider_specialty` | `str \| null` | No | |
| `required_prerequisites` | `str \| null` | No | |
| `missing_records` | `str \| null` | No | |
| `contradictory_flags` | `str \| null` | No | |
| `known_exclusions_present` | `str \| null` | No | |

### Additional (2)
| Field | Type | Required | Notes |
|---|---|---|---|
| `utilization_review_note` | `str \| null` | No | Prior UR assessment / denial reasons |
| `raw_clinical_notes` | `str \| null` | No | Unstructured fallback. Max 60,000 chars. Sanitized against prompt injection |

### SourcedField Type

Three fields (`functional_impairment_adls`, `objective_neurologic_deficits`, `imaging_findings`) use `SourcedField` instead of a plain string:

```json
{
  "value": "Hyperreflexia, Hoffmann sign",
  "source": "Neurology consult (recent)",
  "source_date": "3 months prior"
}
```

Source attribution is used during adjudication to determine if contradictions exist across documents.

---

## Output Schema

Defined in `backend/skill/schema.py` as `PreAuthSkillOutput`.

| Field | Type | Description |
|---|---|---|
| `case_id` | `str` | Passed through from input |
| `requested_service` | `str` | Passed through from input |
| `recommendation` | `"LIKELY_APPROVE" \| "NEED_MORE_INFO" \| "LIKELY_DENY"` | Final adjudication verdict |
| `confidence` | `"HIGH" \| "MEDIUM" \| "LOW"` | Confidence in the recommendation |
| `clinical_summary` | `str` | 3–5 sentence synthesis including demographics |
| `criteria_results` | `List[CriterionResult]` | Per-criterion verdicts |
| `criteria_met` | `List[str]` | Criterion IDs with `MET` status |
| `criteria_partial_or_unmet` | `List[str]` | Criterion IDs with `PARTIAL` or `UNMET` status |
| `supporting_evidence` | `List[EvidenceSnippet]` | Source-attributed evidence excerpts |
| `missing_information` | `List[str]` | Documentation gaps to resolve |
| `provider_query` | `str` | Numbered specific requests to the provider |
| `appeal_direction` | `str \| null` | **Only populated for `LIKELY_DENY`** |
| `flip_condition` | `str \| null` | What additional documentation would improve outcome |
| `validation_insights` | `ValidationInsights \| null` | Data quality score + field issues + hints |
| `consistency_score` | `float \| null` | 0.0–1.0 QA score |
| `contradiction_risk_index` | `float \| null` | 0.0–1.0 risk score |
| `appeal_readiness_score` | `float \| null` | 0.0–1.0 readiness score |
| `audit_flags` | `List[str]` | Human-readable QA flag messages |
| `processing_time_ms` | `int` | Total pipeline wall time |
| `step1_time_ms` | `int` | Extraction LLM call duration |
| `step2_time_ms` | `int` | Adjudication LLM call duration |
| `model_used` | `str` | The Mistral model that served the request |

### CriterionResult

```json
{
  "criterion_id": "C1",
  "criterion_name": "Imaging correlates with symptoms",
  "status": "MET",
  "supporting_evidence": "MRI shows severe canal stenosis. (radiology report)",
  "gap_or_risk": null
}
```

### EvidenceSnippet

```json
{
  "source": "raw_clinical_notes",
  "excerpt": "Hyperreflexia; Hoffmann sign."
}
```

---

## Criteria Registry (7 Service Types)

Defined in `backend/skill/criteria_registry.py`.

### Spine Surgery (6 criteria)
Applied when service contains: `cervical`, `lumbar`, `fusion`, `decompression`

| ID | Criterion |
|---|---|
| C1 | Imaging correlates with symptoms |
| C2 | Objective neurologic deficit documented |
| C3 | Failure of adequate conservative treatment |
| C4 | Functional impairment documented |
| C5 | Inpatient site-of-care justification |
| C6 | No policy prerequisites missing |

### DME Home Oxygen (4 criteria)
Applied when service contains: `home oxygen`, `nocturnal`

| ID | Criterion |
|---|---|
| C1 | Chronic hypoxemia documented |
| C2 | Daytime oxygen saturation |
| C3 | Nocturnal desaturation |
| C4 | Alternative causes ruled out |

### Biologic Therapy (4 criteria)
Applied when service contains: `biologic`, `ivig`

| ID | Criterion |
|---|---|
| C1 | Confirmed diagnosis |
| C2 | Failed conventional therapy |
| C3 | Severity criteria met |
| C4 | Prerequisite treatments completed |

### Post-Acute Rehab (4 criteria)
Applied when service contains: `rehabilitation`

| ID | Criterion |
|---|---|
| C1 | Medical stability |
| C2 | Rehabilitation potential |
| C3 | Need for multidisciplinary care |
| C4 | Site-of-care appropriateness |

### High-Cost Imaging (4 criteria)
Applied when service contains: `pet/ct`, `pet scan`

| ID | Criterion |
|---|---|
| C1 | Established diagnosis |
| C2 | Expected impact on management |
| C3 | Appropriate timing |
| C4 | Prior imaging reviewed |

### Bariatric Surgery (4 criteria)
Applied when service contains: `bariatric`

| ID | Criterion |
|---|---|
| C1 | BMI threshold |
| C2 | Failed non-surgical weight loss |
| C3 | Medical evaluation completed |
| C4 | Informed consent obtained |

### Cardiovascular Procedure (4 criteria)
Applied when service contains: `tavr`, `valve`

| ID | Criterion |
|---|---|
| C1 | Severe valve disease |
| C2 | Symptoms consistent with severity |
| C3 | High or prohibitive surgical risk |
| C4 | Anatomical suitability |

### Adding a New Service Type

1. Define a new `List[Criterion]` constant in `criteria_registry.py`
2. Add it to `_CRITERIA_REGISTRY` dict with a service type key
3. Add keyword → service type tuple(s) to `SERVICE_TYPE_MAP` (first-match-wins, order matters)

---

## Recommendation Decision Logic

Core criteria = C1, C2, C3 (or first 3 for non-spine services)
Secondary criteria = C4, C5, C6 (or remaining criteria)

| Core criteria status | Secondary criteria status | Recommendation | Confidence |
|---|---|---|---|
| All MET | All MET or N/A | LIKELY_APPROVE | HIGH |
| All MET | Some PARTIAL | NEED_MORE_INFO | MEDIUM |
| All MET | All PARTIAL | NEED_MORE_INFO | LOW |
| All PARTIAL, none UNMET | Any | NEED_MORE_INFO | LOW |
| Any PARTIAL, none UNMET | Any | NEED_MORE_INFO | MEDIUM |
| Any core UNMET | Any | LIKELY_DENY | HIGH |

**Key rule:** `PARTIAL` always maps to `NEED_MORE_INFO`. PARTIAL means a documentation gap exists, not that the clinical need is absent. Only a genuinely absent clinical fact triggers `LIKELY_DENY`.

**Output field rules by recommendation:**
- `NEED_MORE_INFO` → `provider_query` populated with numbered asks; `appeal_direction = null`
- `LIKELY_DENY` → both `provider_query` and `appeal_direction` must be populated
- `LIKELY_APPROVE` → `provider_query = ""`; `appeal_direction = null`; `flip_condition = null`

---

## QA Audit Scoring

Three deterministic scores are computed in `core/auditor.py` after adjudication. No LLM involved.

### Consistency Score

Measures how well the recommendation aligns with the criterion outcomes.

```
base = quality_score (from validator)
penalty += 0.25  if criteria_results is empty
penalty += 0.10  if no supporting evidence
penalty += 0.30  if LIKELY_APPROVE but unmet_count > 0
penalty += 0.15  if LIKELY_APPROVE but partial_count > 1
penalty += 0.35  if LIKELY_DENY but unmet_count == 0
penalty += 0.15  if NEED_MORE_INFO but unmet_count > 1
bonus  += 0.15  if LIKELY_APPROVE with zero UNMET and zero PARTIAL
bonus  += 0.10  if LIKELY_DENY with at least 1 UNMET
bonus  += 0.05  if NEED_MORE_INFO with at least 1 PARTIAL

consistency_score = clamp(base - penalty + bonus, 0.0, 1.0)
```

### Contradiction Risk Index

Measures internal consistency of evidence narratives.

```
risk = 0.05 (baseline)
risk += min(0.18 × contradiction_signals, 0.55)
risk += min(0.08 × partial_count, 0.24)
risk += 0.12  if supporting_count == 0

contradiction_risk_index = clamp(risk, 0.0, 1.0)
```

Contradiction signals are counted by scanning all text fields for keywords: `"contradict"`, `"inconsisten"`, `"conflict"`, `"mismatch"`, `"versus"`.

### Appeal Readiness Score

Estimates how actionable an appeal would be with current evidence.

```
evidence_strength = min(supporting_count / 5.0, 1.0)
actionable_missing = min(missing_count / 4.0, 1.0)

base = 0.45 (LIKELY_DENY) | 0.50 (NEED_MORE_INFO) | 0.25 (LIKELY_APPROVE)
score = base + 0.30 × evidence_strength + 0.20 × actionable_missing - 0.15 × contradiction_risk

appeal_readiness_score = clamp(score, 0.0, 1.0)
```

### Audit Flags

Human-readable flags are generated when scores cross thresholds:
- `consistency_score < 0.55` → "Low consistency between recommendation and criterion outcomes."
- `contradiction_risk_index >= 0.50` → "High contradiction risk detected."
- `LIKELY_DENY` with zero UNMET criteria → "Denial recommendation lacks explicit UNMET criteria support."
- `missing_count >= 3` → "High documentation gap burden identified."
- `appeal_readiness_score >= 0.70` → "Appeal packet is likely actionable with current evidence footprint."

---

## Appeal Packet Generation

**Endpoint:** `POST /api/v1/review/appeal`
**Input:** `PreAuthSkillOutput` (the full report)
**Output:** `AppealDraftResponse`
**LLM used:** None — fully deterministic Python (`core/appeal.py`)

### AppealDraftResponse Fields

| Field | Description |
|---|---|
| `case_id` | From original report |
| `recommendation` | From original report |
| `summary_of_medical_necessity` | Auto-generated 2-sentence medical necessity statement |
| `criterion_rebuttals` | One entry per PARTIAL/UNMET criterion with evidence + gap action |
| `missing_evidence_checklist` | Deduplicated list from `missing_information` |
| `requested_reconsideration_text` | Template reconsideration letter referencing rebuttal count |

---

## API Reference

Base URL (local): `http://localhost:8000`
Base URL (production): configured in `render.yaml`

All endpoints are available at `/api/v1/...` (versioned) and `/api/...` (legacy aliases).

### `GET /api/v1/status`

Health check. Returns model name.

**Response:**
```json
{ "status": "ok", "model": "mistral-large-latest" }
```

---

### `POST /api/v1/review`

Run a full prior authorization review.

**Request body:** `PreAuthCaseInput` (JSON)

**Response:** `PreAuthSkillOutput` (JSON)

**Error responses:**
- `400` — invalid input (missing required fields)
- `413` — request body too large (> 10MB)
- `422` — pipeline assembly failure (structured debug info in body)
- `500` — unexpected server error

---

### `POST /api/v1/review/upload`

Run a review from an uploaded Excel workbook (`.xlsx`).

**Request:** `multipart/form-data` with `file` field

**Supported sheet names:**
- `Complex_Case_Input` — 19-row structured case packet
- `Training_Cases` — standard training case format
- Any other sheet — raw content serialized as clinical notes

**Response:** `PreAuthSkillOutput` (JSON)

**Error responses:**
- `400` — non-`.xlsx` file
- `413` — file too large (> 50MB)
- `422` — empty workbook or assembly failure

---

### `POST /api/v1/review/appeal`

Generate a deterministic appeal packet from an existing report.

**Request body:** `PreAuthSkillOutput` (JSON)

**Response:** `AppealDraftResponse` (JSON)

---

### `GET /api/v1/samples`

List all 10 training cases.

**Response:** `List[TrainingCaseRow]`

---

### `GET /api/v1/samples/complex`

Get the full PA-001 complex case as a `PreAuthCaseInput` object.

**Response:** `PreAuthCaseInput` (JSON)

---

### `GET /api/v1/samples/{sample_id}`

Get a single training case by ID (e.g. `PA-001`).

**Response:** `TrainingCaseRow` with `has_full_packet` flag

---

### `GET /api/v1/fields`

List all 30 input field descriptions from the workbook schema.

**Response:** `List[SchemaFieldRow]`

---

### `GET /api/v1/fields/schema`

Get the full auto-generated JSON Schema for input and output models.

**Response:**
```json
{
  "input": { /* PreAuthCaseInput JSON Schema */ },
  "output": { /* PreAuthSkillOutput JSON Schema */ }
}
```

---

### `GET /api/v1/benchmark`

Run all 10 training cases through the pipeline and compare against expected outcomes.

**Auth required:** `?key={API_KEY}` query param (if `API_KEY` env var is set)

**Response:** `ValidationSummary`
```json
{
  "total": 10,
  "correct": 8,
  "accuracy": 0.8,
  "results": [...]
}
```

---

### `GET /api/v1/benchmark/stream`

Same as benchmark but streams progress as Server-Sent Events.

**Events:** `{ "type": "progress", "current": N, "total": 10, "case_id": "...", "result": {...} }`

---

### Legacy Aliases

All endpoints above are also available under `/api/` (without `v1`):

| Legacy | Versioned |
|---|---|
| `GET /api/health` | `GET /api/v1/status` |
| `POST /api/analyze` | `POST /api/v1/review` |
| `POST /api/analyze/upload` | `POST /api/v1/review/upload` |
| `POST /api/analyze/appeal` | `POST /api/v1/review/appeal` |
| `GET /api/cases` | `GET /api/v1/samples` |
| `GET /api/cases/{id}` | `GET /api/v1/samples/{id}` |
| `GET /api/schema` | `GET /api/v1/fields` |
| `GET /api/schema/json` | `GET /api/v1/fields/schema` |
| `GET /api/validate-all` | `GET /api/v1/benchmark` |
| `GET /api/validate-all/stream` | `GET /api/v1/benchmark/stream` |
| `GET /api/complex-case/input` | `GET /api/v1/samples/complex` |

---

## Frontend Routes

| Route | Description |
|---|---|
| `/` | Landing page — feature overview, architecture diagram, CTA |
| `/dashboard` | Stat strip, case selector, help banner, QA dataset table |
| `/review` | Manual case entry form (35 fields, grouped by category) |
| `/analyze` | Same as `/review` (alias) |
| `/report` | Report display after analysis |
| `/result` | Same as `/report` (alias) |
| `/user-guide` | Step-by-step workflow instructions |

### Data Flow (Frontend)

1. User selects case / uploads file / fills form on `/dashboard` or `/review`
2. `useAnalyze` hook calls `POST /api/v1/review` or `POST /api/v1/review/upload`
3. Result stored in `sessionStorage` with key `medclear_report_{case_id}_{timestamp}`
4. Current key stored in `medclear_last_key`
5. History (up to 20 entries) stored in `localStorage` under `medclear_history`
6. Router navigates to `/report`
7. `result/page.tsx` reads result from `sessionStorage` (or redirects to `/review` if empty)

---

## Design System

### Font

**DM Sans** — loaded via `next/font/google` in `app/layout.tsx`.
CSS variable: `--font-dm-sans`

### Design Tokens

```css
/* Light mode */
--primary:           #16a34a   (green)
--primary-foreground:#ffffff
--accent:            #22c55e
--foreground:        #102218
--muted-foreground:  #3f5b46
--card:              #ffffffee
--card-foreground:   #0a0a0a
--muted:             #f7fee7
--border:            #ccebd5
--input:             #ccebd5
--ring:              #16a34a
--background:        #ffffff
--secondary:         #f0fdf4
```

### Utility Classes

| Class | Styles | Usage |
|---|---|---|
| `.premium-card` | `rounded-xl border bg-card p-5 shadow-sm` | General content card |
| `.premium-button-primary` | Green filled, rounded-lg | Primary actions |
| `.premium-button-secondary` | Bordered neutral, rounded-lg | Secondary actions |
| `.premium-input` | Rounded input with focus ring | Form inputs |
| `.premium-textarea` | Rounded textarea with resize | Form textareas |
| `.premium-table` | Full-width borderless table | Data tables |
| `.report-section` | `border-t border-border pt-6` | Section dividers in report |
| `.criteria-row` | `border-l-4 pl-4 py-3` | Timeline rows in criteria list |
| `.report-section-label` | `text-xs font-semibold uppercase tracking-widest` | Section headings |
| `.responsive-container` | `max-w-5xl mx-auto px-4 py-6` | Page wrapper |
| `.form-section` | Same as `premium-card` | Form group wrapper |
| `.glass` | Backdrop blur + semi-transparent background | Navbar overlay |

### Font Size Rules

Never use `text-[10px]` or `text-[11px]`. Minimum is `text-xs` (12px).

| Use case | Class |
|---|---|
| Section labels | `text-xs uppercase tracking-widest font-semibold` |
| Metadata / badges | `text-xs` |
| Body text | `text-sm leading-relaxed` |
| Card headings | `text-base font-semibold` or `text-lg font-semibold` |
| Section headings | `text-xl font-bold` |
| Page titles | `text-2xl` to `text-4xl font-bold` |
| Hero verdicts | `text-3xl` to `text-4xl font-bold` |

### Icon Library

`@heroicons/react/24/outline` only. Import pattern:
```tsx
import { CheckCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
```

---

## Configuration Reference

### Model Fallback Chain

The system tries each model in `MISTRAL_MODEL_CANDIDATES` in order:
```
MISTRAL_MODEL_CANDIDATES = "mistral-large-latest,devstral-2512"
```

If the first model fails (rate limit, timeout, API error), it automatically retries with the next candidate. The model that successfully served the request is stored in `output.model_used`.

### Retry Configuration (Mistral client)

```python
RetryConfig(
    strategy="backoff",
    backoff=BackoffStrategy(
        initial_interval=1000,    # 1 second
        max_interval=30000,       # 30 seconds
        exponent=2.0,             # exponential
        max_elapsed_time=120000,  # 2 minutes total
    ),
    retry_connection_errors=True,
)
```

---

## Error Types

All errors are defined in `backend/core/exceptions.py`.

| Exception | Parent | When Raised | HTTP Status |
|---|---|---|---|
| `EngineError` | `RuntimeError` | Base engine error | — |
| `EngineStepError` | `EngineError` | Any pipeline step failure | 422 |
| `ExtractionError` | `EngineStepError` | Step 1 LLM call or JSON parse fails | 422 |
| `AdjudicationError` | `EngineStepError` | Step 3 LLM call or JSON parse fails | 422 |
| `CompositionError` | `EngineError` | Step 4 assembly or Pydantic validation fails | 422 |
| `LLMClientError` | `EngineError` | All model candidates exhausted | 422 |
| `AssemblyError` | `Exception` | Pydantic validation in assembler fails | 422 |

`main.py` catches all of the above and returns structured JSON errors.

`AssemblyError` is deliberately NOT an `EngineError` — the skill layer must not import from the web framework.

---

## Security

### Input Sanitization

All `raw_clinical_notes` content passes through `_sanitize_text()` in `schema.py`:
- Removes null bytes and control characters
- Limits consecutive special characters (`*`, `` ` ``, `_`) to max 10
- Strips common prompt injection patterns:
  - `"ignore previous instructions"`
  - `"disregard the above"`
  - `"new instructions:"`
  - `<ignore>`, `<system>`, `<assistant>` tags

### API Key Protection

- `MISTRAL_API_KEY` loaded via `python-dotenv`, never hardcoded
- Never logged or printed
- `.env` files are in `.gitignore`

### CORS

Configured in `core/middleware.py`:
- In development: allows `localhost:3000`, `localhost:3001`, `127.0.0.1:3000`, `127.0.0.1:3001`
- In production (`ENVIRONMENT=production`): only origins from `ALLOWED_ORIGINS`, `FRONTEND_URL`, `NEXT_PUBLIC_FRONTEND_URL`

### Request Size Limits

`RequestSizeLimitMiddleware` enforces limits before the body is processed:
- HTTP requests: 10MB (configurable via `MAX_REQUEST_BODY_BYTES`)
- Excel uploads: 50MB (configurable via `MAX_UPLOAD_FILE_SIZE`)
- Raw clinical notes: 60,000 characters (configurable via `MAX_RAW_CLINICAL_NOTES_LENGTH`)

### Never Commit

```
.env
.env.*
*.pem
*.key
*.crt
*.p12
*.pfx
id_rsa
id_ed25519
secrets.*
credentials.*
```

---

## Deployment (Render)

The project includes a `render.yaml` for one-click deployment on [Render.com](https://render.com).

### Backend Service

```yaml
type: web
name: medclear-backend
runtime: python
pythonVersion: "3.11"
rootDir: backend
buildCommand: pip install -r requirements.txt
startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
plan: free
```

**Required environment variables on Render:**
- `MISTRAL_API_KEY` — your Mistral API key
- `API_KEY` — secret for benchmark endpoint
- `ALLOWED_ORIGINS` — your frontend Render URL (e.g. `https://medclear-app.onrender.com`)
- `ENVIRONMENT` — set to `production`

### Frontend Service

```yaml
type: static
name: medclear-frontend
rootDir: frontend
buildCommand: npm install && npm run build
publishPath: out
plan: free
```

Next.js is configured with `output: 'export'` in `next.config.ts`, producing a static site that can be hosted on any static host (Render, Vercel, Netlify, S3, etc.).

**Required environment variable on Render:**
- `NEXT_PUBLIC_API_URL` — your backend Render URL (e.g. `https://medclear-api.onrender.com`)

### Production Checklist

- [ ] Set `MISTRAL_API_KEY` in backend environment
- [ ] Set `ALLOWED_ORIGINS` to match your frontend domain
- [ ] Set `ENVIRONMENT=production` to enforce strict CORS
- [ ] Set `API_KEY` if you want to protect the benchmark endpoint
- [ ] Set `NEXT_PUBLIC_API_URL` in frontend environment to point to production backend
- [ ] Verify `GET /api/v1/status` returns `200 OK` before testing flows
