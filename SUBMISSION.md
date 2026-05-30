# PreAuthIQ — Submission Overview

PreAuthIQ is a prior-authorization copilot that takes a clinical case packet (structured fields, raw notes, or an Excel workbook), runs it through a fixed four-step pipeline, and returns a reviewer-ready recommendation with per-criterion evidence, documentation gaps, and a provider outreach query.

**Live demo:** [Frontend](https://pre-auth-iq.vercel.app) · [Backend API / Swagger](https://preauthiq.onrender.com/docs) · [Complex case example output](docs/examples/complex_case_output.json)

---

## 1. Approach

Prior authorization is modeled as a **deterministic pipeline with two bounded LLM calls**, not a single open-ended chat. Each stage has one job; failures point to a specific step.

```mermaid
flowchart LR
  intake[CaseInput] --> step1[Extract_LLM1]
  step1 --> step2[Validate_Python]
  step2 --> step3[Adjudicate_LLM2]
  step3 --> step4[Assemble_Python]
  step4 --> report[PreAuthSkillOutput]
```

| Step | What happens | LLM? |
|------|----------------|------|
| **1. Extract** | Normalize raw/structured input into 35 schema fields with source attribution | Yes (Mistral) |
| **2. Validate** | Quality score, required-field checks, policy routing to the right criterion set | No |
| **3. Adjudicate** | Score each payer criterion (MET / PARTIAL / UNMET / N/A) and draft recommendation | Yes (Mistral) |
| **4. Assemble** | Enforce output rules, sync criterion lists, compute QA metrics, shape final JSON | No |

**Design principles**

1. **Separation of concerns** — Step 1 extracts facts only; it does not approve or deny. Step 2 does not invent clinical data missing from extraction.
2. **Policy routing in code** — Service type (spine, DME, imaging, etc.) is resolved in `backend/skill/criteria_registry.py` via keyword match, so prompts stay stable and testable.
3. **Post-LLM enforcement** — `backend/skill/assembler.py` corrects inconsistent criterion lists, nulls `appeal_direction` unless the verdict is `LIKELY_DENY`, and applies promotion rules where appropriate.
4. **Source attribution** — Critical fields use `SourcedField` (value + source + date). Contradictions are recorded in `contradictory_flags`, not silently overwritten.
5. **Reviewer-first output** — `PreAuthSkillOutput` maps directly to UI sections: recommendation banner, criteria table, evidence panel, missing info, provider query, flip condition.

The complex assignment case (PA-001, cervical myelopathy) is intentionally designed to show **clinical support with documentation gaps** → `NEED_MORE_INFO`, not an automatic deny.

---

## 2. Prompt / skill design

**Source of truth:** `backend/skill/schema.py` (`PreAuthCaseInput`, `PreAuthSkillOutput`)  
**Prompts:** `backend/skill/prompts.py`  
**Criteria sets:** `backend/skill/criteria_registry.py`  
**Assembly rules:** `backend/skill/assembler.py`

### Step 1 — Normalization (`NORMALIZATION_SYSTEM_PROMPT`)

- **Role:** structured clinical extraction engine only — no utilization judgment.
- **Output:** 30 workbook-aligned fields plus metadata (`case_id`, policy excerpt, raw notes, etc.).
- **Rules:**
  - Extract only what is explicitly stated; use `null` when absent — no guessing.
  - Attach source document type for each fact; use `SourcedField` for ADL impact, neurologic exam, and imaging.
  - Record conflicting sources in `contradictory_flags` (e.g. old PCP “strength intact” vs recent neuro “Hoffmann positive”).
  - Allergies, side effects, and intolerances go in `medication_contraindications` — no separate allergies field.
- **Settings:** temperature `0.0`, sufficient `max_tokens` to avoid truncated JSON on long packets.

### Step 2 — Adjudication (`EVALUATION_SYSTEM_PROMPT_TEMPLATE`)

- **Role:** utilization reviewer applying payer criteria injected at runtime.
- **Criteria injection:** `str.replace("{criteria_block}", ...)` — **not** Python `.format()`, because criterion text may contain `{` or `}` characters.
- **Statuses:**
  - `MET` — requirement clearly documented.
  - `PARTIAL` — clinically plausible but **documentation gap** (pend, not deny).
  - `UNMET` — requirement not met.
  - `N/A` — not applicable to this service type.
- **Recommendation logic** (prompt + assembler):

| Core criteria (C1–C3) | Secondary (C4–C6) | Verdict |
|----------------------|-------------------|---------|
| All MET | All MET or N/A | `LIKELY_APPROVE` |
| All MET | Some PARTIAL | `NEED_MORE_INFO` |
| Any PARTIAL, none UNMET | Any | `NEED_MORE_INFO` |
| Any core UNMET | Any | `LIKELY_DENY` |

`PARTIAL` must never be treated as a clinical failure by itself — it drives `NEED_MORE_INFO` and a concrete `provider_query` / `flip_condition`.

### Step 3 — Assembly (no LLM)

- Validates and coerces LLM JSON into `PreAuthSkillOutput`.
- Syncs `criteria_met` and `criteria_partial_or_unmet` with `criteria_results`.
- Computes QA scores: consistency, contradiction risk, appeal readiness.
- Sets `appeal_direction` only for `LIKELY_DENY`; clears `flip_condition` / `provider_query` when `LIKELY_APPROVE` per assembler rules.

---

## 3. Assumptions

| Area | Assumption |
|------|------------|
| **Policy** | Criteria are a **synthetic abstraction** of commercial policies (spine, DME, imaging, etc.), not a live payer policy feed. |
| **LLM** | Mistral API is available; default model `mistral-large-latest` (overridable via env). |
| **Input format** | Assignment workbook sheets: `Training_Cases`, `Complex_Case_Input`, `Patient_Data_Aspects`, `Complex_Case_Outcome`. |
| **PHI** | All sample data is **synthetic** for demonstration; production would need BAAs, audit logs, and de-identification. |
| **Service routing** | First keyword match in `SERVICE_TYPE_MAP` wins; ambiguous requests may fall back to `default` (shorter criterion set). |
| **Site of care** | Inpatient vs outpatient/ASC requires **documented** rationale in the packet, not inference from comorbidities alone. |
| **Security** | Optional `API_KEY` on API routes; CORS limited to configured frontend origins. |
| **Language** | English clinical text only. |

---

## 4. Limitations

1. **LLM variability** — Wording may differ between runs; PA-001 rubric (`NEED_MORE_INFO`, C1–C3 MET, C4–C6 PARTIAL) is covered by `backend/tests/test_complex_scenario.py`.
2. **Cold starts** — Render free tier sleeps after idle; first request can take 30–60 seconds (mitigated with a scheduled uptime ping).
3. **No EHR integration** — Cases enter via form, paste, or `.xlsx` upload only.
4. **Limited service coverage** — Seven typed policy templates plus `default`; uncommon procedures get generic criteria.
5. **Contradiction handling** — Conflicts are flagged and narrated; the system does not run full temporal medico-legal reasoning.
6. **Not a legal/clinical authority** — Output is **decision support** for utilization reviewers, not a substitute for licensed UR judgment or contract interpretation.
7. **Cost and latency** — Two LLM calls per case; complex packets can take ~20–30 seconds end-to-end.

---

## 5. Possible improvements

| Priority | Improvement | Why it matters |
|----------|-------------|----------------|
| **High** | FHIR / HL7 intake from EHR | Removes manual paste and reduces extraction errors |
| **High** | Human-in-the-loop overrides | Reviewer can correct criterion status before sign-off with audit trail |
| **Medium** | RAG over real payer policy PDFs | Plan-specific criteria instead of synthetic abstractions |
| **Medium** | Extraction–adjudication consistency score | Flag when Step 2 cites facts not present in Step 1 |
| **Medium** | Batch review API | Overnight processing for queue backlogs |
| **Low** | Split models (cheap extract, frontier adjudicate) | Lower cost at scale |
| **Low** | Export appeal packet to PDF | Payer-ready document from `AppealDraftResponse` |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [docs/ASSIGNMENT.md](docs/ASSIGNMENT.md) | Full deliverables checklist (repo, API, frontend, example JSON) |
| [README.md](README.md) | Technical setup, API reference, deployment |
| [docs/examples/complex_case_output.json](docs/examples/complex_case_output.json) | Example output for PA-001 complex case |
