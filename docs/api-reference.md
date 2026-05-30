# PreAuthIQ Backend API Documentation

PreAuthIQ prior authorization copilot — FastAPI backend.

---

## Quick Links

| Resource | URL (local) |
|---|---|
| Base URL | `http://localhost:8000` |
| Versioned API prefix | `/api/v1` |
| Swagger UI (interactive) | `http://localhost:8000/docs` |
| ReDoc | `http://localhost:8000/redoc` |
| OpenAPI JSON | `http://localhost:8000/openapi.json` |

**Start server:**

```bash
cd backend
.\venv\Scripts\activate          # Windows
uvicorn main:app --reload --port 8000
```

---

## Overview

The backend runs a **4-step pipeline** for each review request:

1. **Extraction** — Mistral LLM normalizes clinical input
2. **Validation** — Python checks input quality and enriches fields
3. **Adjudication** — Mistral LLM evaluates payer policy criteria
4. **Assembly** — Python composes the final report with QA audit scores

Primary LLM model is configured via `MISTRAL_MODEL` (default: `mistral-large-latest`).

---

## Authentication

| Endpoint group | Auth required |
|---|---|
| Review, samples, fields, status | No |
| Benchmark (`/benchmark`, `/benchmark/stream`) | Yes, **if** `API_KEY` is set in backend `.env` |

When `API_KEY` is configured, send:

```http
Authorization: Bearer <your-api-key>
```

If `API_KEY` is empty, benchmark endpoints are open (development mode).

---

## Common Headers

```http
Content-Type: application/json
Accept: application/json
```

For file upload:

```http
Content-Type: multipart/form-data
```

---

## Error Responses

| Status | Meaning |
|---|---|
| `400` | Invalid input (validation error, wrong file type) |
| `401` | Missing or invalid API key (benchmark only) |
| `404` | Sample ID not found |
| `413` | Request body or upload file too large |
| `422` | Pipeline failure (LLM/assembly error) |
| `503` | Data files missing (run `scripts/parse_workbook.py`) |
| `500` | Unexpected server error |

Error body format (FastAPI default):

```json
{
  "detail": "Human-readable error message"
}
```

---

## Endpoints (v1)

### Health & Status

#### `GET /api/v1/status`

Returns service health and active Mistral model name.

**Response `200`:**

```json
{
  "status": "ok",
  "model": "mistral-large-latest"
}
```

**Legacy alias:** `GET /api/health`

---

### Review (Core)

#### `POST /api/v1/review`

Run a full prior authorization review on structured clinical input.

**Request body:** `PreAuthCaseInput` (JSON)

**Required fields:**
- `requested_service` (string, max 500 chars)
- `primary_diagnosis` (string, max 500 chars)

**Response `200`:** `PreAuthSkillOutput` (JSON)

**Example request:**

```json
{
  "case_id": "PA-003",
  "requested_service": "Total knee arthroplasty",
  "primary_diagnosis": "End-stage osteoarthritis with major functional decline",
  "raw_clinical_notes": "Severe tricompartmental OA on X-ray; failed NSAIDs/injection/PT; cane use; inability to climb stairs."
}
```

**Example response (abbreviated):**

```json
{
  "case_id": "PA-003",
  "requested_service": "Total knee arthroplasty",
  "recommendation": "LIKELY_APPROVE",
  "confidence": "HIGH",
  "clinical_summary": "...",
  "criteria_results": [
    {
      "criterion_id": "C1",
      "criterion_name": "Imaging correlates with symptoms",
      "status": "MET",
      "supporting_evidence": "...",
      "gap_or_risk": null
    }
  ],
  "criteria_met": ["C1", "C2", "C3"],
  "criteria_partial_or_unmet": [],
  "supporting_evidence": [
    { "source": "X-ray report", "excerpt": "..." }
  ],
  "missing_information": [],
  "provider_query": "",
  "appeal_direction": null,
  "flip_condition": null,
  "validation_insights": {
    "quality_score": 0.85,
    "required_field_issues": [],
    "enrichment_hints": []
  },
  "consistency_score": 0.92,
  "contradiction_risk_index": 0.1,
  "appeal_readiness_score": 0.88,
  "audit_flags": [],
  "processing_time_ms": 4200,
  "step1_time_ms": 1800,
  "step2_time_ms": 2100,
  "model_used": "mistral-large-latest"
}
```

**Recommendation values:** `LIKELY_APPROVE` | `NEED_MORE_INFO` | `LIKELY_DENY`

**Legacy alias:** `POST /api/analyze`

---

#### `POST /api/v1/review/upload`

Run a review from an uploaded Excel workbook (`.xlsx` only).

**Request:** `multipart/form-data` with field name `file`

**Max file size:** 50 MB (configurable via `MAX_UPLOAD_FILE_SIZE`)

**Sheet handling:**

| Sheet name | Behavior |
|---|---|
| `Complex_Case_Input` | Parses 19-row structured PA-001 packet |
| `Training_Cases` | Uses first row + expanded clinical notes + workbook context |
| Other / any | Serializes all non-empty rows as `raw_clinical_notes` |

**Response `200`:** `PreAuthSkillOutput`

**Example (curl):**

```bash
curl -X POST http://localhost:8000/api/v1/review/upload \
  -F "file=@case_packet.xlsx"
```

**Legacy alias:** `POST /api/analyze/upload`

---

#### `POST /api/v1/review/appeal`

Generate a deterministic appeal packet from an existing review report. **No LLM call.**

**Request body:** `PreAuthSkillOutput` (full report from `/review`)

**Response `200`:** `AppealDraftResponse`

```json
{
  "case_id": "PA-002",
  "recommendation": "LIKELY_DENY",
  "summary_of_medical_necessity": "...",
  "criterion_rebuttals": ["..."],
  "missing_evidence_checklist": ["..."],
  "requested_reconsideration_text": "..."
}
```

**Legacy alias:** `POST /api/analyze/appeal`

---

### Samples & Schema

#### `GET /api/v1/samples`

List all 10 QA training cases.

**Response `200`:** Array of training case objects.

```json
[
  {
    "case_id": "PA-001",
    "requested_service": "C5-C6 cervical decompression/fusion (inpatient)",
    "clinical_scenario": "...",
    "key_supporting_evidence": "...",
    "key_gaps_or_risks": "...",
    "expected_outcome": "NEED_MORE_INFO",
    "why": "...",
    "if_additional_documentation_arrives": "...",
    "complexity_notes": "...",
    "expanded_clinical_notes": "=== STRUCTURED CLINICAL PACKET ..."
  }
]
```

**Legacy alias:** `GET /api/cases`

---

#### `GET /api/v1/samples/{sample_id}`

Get a single training case by ID (e.g. `PA-001`, `PA-003`).

**Response `200`:** Training case object + `has_full_packet: true` for PA-001.

**Response `404`:** Sample not found.

**Legacy alias:** `GET /api/cases/{sample_id}`

---

#### `GET /api/v1/samples/complex`

Return the full PA-001 complex case as a ready-to-submit `PreAuthCaseInput` (19 structured fields populated).

**Response `200`:** `PreAuthCaseInput`

**Legacy alias:** `GET /api/complex-case/input`

---

#### `GET /api/v1/fields`

List all 30 patient data field descriptions from the workbook schema.

**Response `200`:** Array of schema field rows.

```json
[
  {
    "id": 1,
    "category": "Demographics",
    "aspect": "Age / sex",
    "description": "...",
    "typical_type": "string",
    "example_value": "...",
    "why_it_matters": "..."
  }
]
```

**Legacy alias:** `GET /api/schema`

---

#### `GET /api/v1/fields/schema`

Auto-generated JSON Schema for input and output Pydantic models.

**Response `200`:**

```json
{
  "input": { /* PreAuthCaseInput JSON Schema */ },
  "output": { /* PreAuthSkillOutput JSON Schema */ }
}
```

**Legacy alias:** `GET /api/schema/json`

---

### Benchmark / Evaluate Performance

#### `GET /api/v1/benchmark`

Run all 10 training cases through the pipeline and compare AI verdict vs expected outcome.

Uses **expanded clinical notes** (not full clinical packets) for each case.

**Auth:** Bearer token if `API_KEY` is set.

**Response `200`:**

```json
{
  "total": 10,
  "correct": 7,
  "accuracy": 0.7,
  "results": [
    {
      "case_id": "PA-002",
      "requested_service": "Elective lumbar fusion for chronic low-back pain",
      "expected": "LIKELY_DENY",
      "actual": "LIKELY_DENY",
      "match": true,
      "confidence": "HIGH",
      "complexity_notes": "Common false-positive case for LLMs...",
      "note": null
    }
  ]
}
```

**Legacy alias:** `GET /api/validate-all`

---

#### `GET /api/v1/benchmark/stream`

Same as benchmark but streams progress as **Server-Sent Events (SSE)**.

**Auth:** Bearer token if `API_KEY` is set.

**Response:** `text/event-stream`

**Progress event:**

```
data: {"type":"progress","current":3,"total":10,"case_id":"PA-003","result":{...}}
```

**Complete event:**

```
data: {"type":"complete","current":10,"total":10,"case_id":null,"result":{...ValidationSummary...}}
```

**Legacy alias:** `GET /api/validate-all/stream`

---

## Legacy Route Map

All v1 endpoints have backward-compatible aliases under `/api/`:

| Legacy route | v1 route |
|---|---|
| `GET /api/health` | `GET /api/v1/status` |
| `POST /api/analyze` | `POST /api/v1/review` |
| `POST /api/analyze/upload` | `POST /api/v1/review/upload` |
| `POST /api/analyze/appeal` | `POST /api/v1/review/appeal` |
| `GET /api/cases` | `GET /api/v1/samples` |
| `GET /api/cases/{id}` | `GET /api/v1/samples/{id}` |
| `GET /api/complex-case/input` | `GET /api/v1/samples/complex` |
| `GET /api/schema` | `GET /api/v1/fields` |
| `GET /api/schema/json` | `GET /api/v1/fields/schema` |
| `GET /api/validate-all` | `GET /api/v1/benchmark` |
| `GET /api/validate-all/stream` | `GET /api/v1/benchmark/stream` |

---

## Data Models

### `PreAuthCaseInput` (Request)

| Field | Type | Required | Description |
|---|---|---|---|
| `case_id` | string | No | Case identifier |
| `requested_service` | string | **Yes** | Procedure/service requested (max 500) |
| `primary_diagnosis` | string | **Yes** | Primary diagnosis (max 500) |
| `raw_clinical_notes` | string | No | Unstructured notes (max 60,000 chars) |
| `site_of_care` | string | No | Inpatient / ASC / Outpatient / etc. |
| `age` | integer | No | Patient age |
| `sex` | string | No | Patient sex |
| `functional_impairment_adls` | SourcedField | No | ADL impact with source |
| `objective_neurologic_deficits` | SourcedField | No | Neuro exam findings with source |
| `imaging_findings` | SourcedField | No | Imaging results with source |
| `prior_conservative_treatment` | string[] | No | Failed conservative therapies |
| `missing_records` | string | No | Documentation gaps |
| `contradictory_flags` | string | No | Conflicting chart signals |
| ... | ... | No | See `/api/v1/fields/schema` for all 35 fields |

**SourcedField:**

```json
{
  "value": "Hyperreflexia, positive Hoffmann sign",
  "source": "Neurology consult",
  "source_date": "recent"
}
```

---

### `PreAuthSkillOutput` (Response)

| Field | Type | Description |
|---|---|---|
| `recommendation` | enum | `LIKELY_APPROVE` \| `NEED_MORE_INFO` \| `LIKELY_DENY` |
| `confidence` | enum | `HIGH` \| `MEDIUM` \| `LOW` |
| `clinical_summary` | string | Narrative case summary |
| `criteria_results` | CriterionResult[] | Per-criterion evaluation |
| `criteria_met` | string[] | IDs of MET criteria (e.g. `["C1","C2"]`) |
| `criteria_partial_or_unmet` | string[] | IDs of PARTIAL/UNMET criteria |
| `supporting_evidence` | EvidenceSnippet[] | Source-anchored excerpts |
| `missing_information` | string[] | Documentation gaps |
| `provider_query` | string | Query to send to ordering provider |
| `flip_condition` | string \| null | What doc would change the outcome |
| `appeal_direction` | string \| null | Appeal guidance (deny cases only) |
| `validation_insights` | object | Input quality score and hints |
| `consistency_score` | float 0–1 | QA audit: chart consistency |
| `contradiction_risk_index` | float 0–1 | QA audit: contradiction risk |
| `appeal_readiness_score` | float 0–1 | QA audit: appeal readiness |
| `audit_flags` | string[] | QA warning flags |
| `processing_time_ms` | int | Total pipeline time |
| `step1_time_ms` | int | Extraction LLM time |
| `step2_time_ms` | int | Adjudication LLM time |
| `model_used` | string | Mistral model that served the request |

**CriterionResult:**

```json
{
  "criterion_id": "C4",
  "criterion_name": "Functional impairment documented",
  "status": "PARTIAL",
  "supporting_evidence": "Difficulty buttoning shirt documented in PT note.",
  "gap_or_risk": "Surgeon note lacks explicit ADL failure statement."
}
```

**Status values:** `MET` | `PARTIAL` | `UNMET` | `N/A`

---

### `AppealDraftResponse`

| Field | Type |
|---|---|
| `case_id` | string |
| `recommendation` | enum |
| `summary_of_medical_necessity` | string |
| `criterion_rebuttals` | string[] |
| `missing_evidence_checklist` | string[] |
| `requested_reconsideration_text` | string |

---

## Limits & Configuration

| Limit | Default | Env variable |
|---|---|---|
| Max request body | 10 MB | `MAX_REQUEST_BODY_BYTES` |
| Max upload file | 50 MB | `MAX_UPLOAD_FILE_SIZE` |
| Max clinical notes | 60,000 chars | `MAX_RAW_CLINICAL_NOTES_LENGTH` |
| Max requested service | 500 chars | `MAX_REQUESTED_SERVICE_LENGTH` |
| Max primary diagnosis | 500 chars | `MAX_PRIMARY_DIAGNOSIS_LENGTH` |
| LLM max output tokens | 4500 | `MISTRAL_MAX_OUTPUT_TOKENS` |
| CORS origins | localhost:3000,3001 | `ALLOWED_ORIGINS` |

---

## Example Workflows

### 1. Submit a manual case

```bash
curl -X POST http://localhost:8000/api/v1/review \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "MANUAL-001",
    "requested_service": "MRI lumbar spine",
    "primary_diagnosis": "Radiculopathy",
    "raw_clinical_notes": "6 weeks radicular leg pain, failed NSAIDs and PT..."
  }'
```

### 2. Upload Excel packet

```bash
curl -X POST http://localhost:8000/api/v1/review/upload \
  -F "file=@training_workbook.xlsx"
```

### 3. Generate appeal from report

```bash
curl -X POST http://localhost:8000/api/v1/review/appeal \
  -H "Content-Type: application/json" \
  -d @report_output.json
```

### 4. Run benchmark (with API key)

```bash
curl http://localhost:8000/api/v1/benchmark \
  -H "Authorization: Bearer your-api-key"
```

---

## Source Code References

| Component | Path |
|---|---|
| Route handlers | `backend/api/routes.py` |
| Pydantic models | `backend/skill/schema.py` |
| Pipeline engine | `backend/core/engine.py` |
| Mistral provider | `backend/core/providers.py` |
| Auth dependencies | `backend/api/dependencies.py` |
| CORS / size limits | `backend/api/middleware.py` |
