---
name: preauthiq-copilot
description: >-
  Full-stack conventions and architecture for the PreAuthIQ prior authorization
  copilot. Use when modifying backend pipeline steps, Pydantic models, criteria
  registry, LLM prompts, or frontend components, layout, and design tokens.
  Apply when the user mentions normalization, adjudication, assembly, criteria,
  schema fields, report UI, dashboard, or any file under backend/ or frontend/.
---

# PreAuthIQ Copilot — Agent Skill

## Architecture at a Glance

```
POST /api/v1/review (PreAuthCaseInput)
        │
        ├─ Step 1  extract_clinical_fields()   → Mistral call #1 (normalization)
        ├─ Step 2  validate_and_enrich_input() → pure Python, no LLM
        │           resolve_policy_rules()     → criteria_registry.py lookup
        ├─ Step 3  adjudicate_policy()         → Mistral call #2 (evaluation)
        │           compute_audit_metrics()    → pure Python scoring
        └─ Step 4  compose_report()            → assembler.py, no LLM
                        │
                        ▼
               PreAuthSkillOutput (Pydantic)
                        │
                        ▼
            Next.js /report page renders result
```

Key files:
- `backend/core/engine.py` — orchestrates all 4 steps
- `backend/skill/schema.py` — all Pydantic models (source of truth)
- `backend/skill/prompts.py` — both LLM prompt templates
- `backend/skill/criteria_registry.py` — service-type → criteria sets
- `backend/skill/assembler.py` — post-LLM validation and enforcement
- `frontend/app/result/page.tsx` — report page layout
- `frontend/app/globals.css` — design tokens and utility classes

---

## Backend Rules

### Schema (`backend/skill/schema.py`)

`PreAuthCaseInput` has exactly **35 fields**:
- 30 from the workbook `Patient_Data_Aspects` sheet (IDs 1–30)
- 5 additional: `case_id`, `payer_policy_excerpt`, `utilization_review_note`, `known_exclusions_present`, `raw_clinical_notes`

Three fields use `SourcedField` (value + source + source_date):
- `functional_impairment_adls`
- `objective_neurologic_deficits`
- `imaging_findings`

Do NOT add a separate `allergies` field — workbook field 19 (`medication_contraindications`) already covers allergies, side effects, and intolerances.

`PreAuthSkillOutput` required fields:
```python
case_id, requested_service, recommendation, confidence,
clinical_summary, criteria_results, criteria_met,
criteria_partial_or_unmet, supporting_evidence,
missing_information, provider_query,
processing_time_ms, step1_time_ms, step2_time_ms, model_used
```
Optional: `appeal_direction`, `flip_condition`, `validation_insights`,
`consistency_score`, `contradiction_risk_index`, `appeal_readiness_score`, `audit_flags`

### Prompts (`backend/skill/prompts.py`)

- Criteria are injected via `str.replace("{criteria_block}", ...)` — **never** `.format()`. `.format()` breaks if criterion text contains `{` or `}`.
- Step 1 prompt: extracts 30 normalized fields into JSON, no clinical judgment.
- Step 2 prompt: evaluates criteria, returns recommendation JSON with `MET/PARTIAL/UNMET/N/A` per criterion.

### Criteria Registry (`backend/skill/criteria_registry.py`)

To add a new service type:
1. Define a `List[Criterion]` constant (e.g. `ONCOLOGY_CRITERIA`)
2. Add it to `_CRITERIA_REGISTRY` dict
3. Add keyword → service_type tuple(s) to `SERVICE_TYPE_MAP` (first-match-wins)

Current service types: `spine_surgery`, `dme_home_oxygen`, `biologic_therapy`,
`post_acute_rehab`, `high_cost_imaging`, `bariatric_surgery`, `cardiovascular_procedure`, `default`

### Assembler (`backend/skill/assembler.py`)

Enforced rules (always apply, no exceptions):
- `appeal_direction = None` unless `recommendation == "LIKELY_DENY"`
- `flip_condition = None` and `provider_query = ""` when `recommendation == "LIKELY_APPROVE"`
- `criteria_met` and `criteria_partial_or_unmet` are auto-corrected to match `criteria_results` statuses

Raises `AssemblyError` (never `HTTPException`) — `main.py` converts it to HTTP 422.

### Recommendation Logic

| Core criteria (C1–C3) | Secondary (C4–C6) | Verdict | Confidence |
|---|---|---|---|
| All MET | All MET or N/A | LIKELY_APPROVE | HIGH |
| All MET | Some PARTIAL | NEED_MORE_INFO | MEDIUM |
| Any PARTIAL, none UNMET | Any | NEED_MORE_INFO | MEDIUM/LOW |
| Any core UNMET | Any | LIKELY_DENY | HIGH |

PARTIAL = documentation gap, not clinical failure. Never deny solely for PARTIAL criteria.

### LLM Configuration

- Temperature: `0.0` (medical reasoning must be deterministic)
- `max_tokens`: 3000 (complex cases reach ~2500 tokens; 2000 risks mid-JSON truncation)
- Model: Mistral via `MistralProvider` (`backend/core/providers.py`)
- API key: loaded via `dotenv` in `main.py`, never hardcoded or logged

---

## Frontend Rules

### Design System

Font: **DM Sans** loaded via `next/font/google` with CSS variable `--font-dm-sans`.

Design tokens (CSS variables in `globals.css`):
```
--primary       #16a34a (green)
--accent        #22c55e
--foreground    #102218
--muted-foreground #3f5b46
--border        #ccebd5
--card          #ffffffee
--muted         #f7fee7
```

Tailwind v4 via `@tailwindcss/postcss`. Config in `tailwind.config.js` maps tokens to CSS vars.

### Component Conventions

Global utility classes (use these, do not reinvent):
- `.premium-card` — `rounded-xl border bg-card p-5 shadow-sm`
- `.premium-button-primary` — green filled button
- `.premium-button-secondary` — bordered neutral button
- `.premium-input` / `.premium-textarea` — form inputs
- `.report-section` — `border-t border-border pt-6` section divider
- `.criteria-row` — `border-l-4 pl-4 py-3` left-border timeline row
- `.report-section-label` — `text-xs font-semibold uppercase tracking-widest`
- `.responsive-container` — `max-w-5xl mx-auto px-4 py-6`

Icons: `@heroicons/react/24/outline` only. Already installed.

### Font Size Rules

**Never use `text-[10px]` or `text-[11px]`** anywhere in the codebase.
Minimum body text: `text-xs` (12px). Preferred body: `text-sm` (14px).

Size hierarchy:
- Section labels: `text-xs uppercase tracking-widest font-semibold`
- Body text: `text-sm leading-relaxed`
- Card headings: `text-base` or `text-lg font-semibold`
- Page headings: `text-xl` to `text-4xl font-bold`

### Report Page Layout (`frontend/app/result/page.tsx`)

The report page uses NO stacked `premium-card` boxes. Structure:
1. `RecommendationBanner` — full `rounded-3xl` gradient hero
2. Action buttons row below hero
3. Single `rounded-3xl` content panel — sections separated by `.report-section` dividers
4. QA Audit strip (if scores present) — 3-col grid
5. Appeal draft (if generated)
6. `ProcessingMetaFooter` + history

Criteria are rendered as a **timeline** (`.criteria-row` with colored left borders via `STATUS_BORDER_L`), not as a `<table>`.

### Dashboard (`frontend/app/dashboard/page.tsx`)

Order of sections:
1. Page heading + subtitle
2. Stat strip (4 neutral cards — no colored backgrounds)
3. `CaseSelector` (`#reviewer-workspace`)
4. Help banner (below CaseSelector)
5. `TrainingCasesTable` (`#audit-console`)

Stat cards use `bg-[var(--card)] border-[var(--border)]` — neutral, no color accents.

---

## Security — Always Follow

- Never commit `.env`, `.env.*`, `*.key`, `*.pem` files
- Never log or print `MISTRAL_API_KEY`
- All `raw_clinical_notes` input is sanitized via `_sanitize_text()` in `schema.py`
- Request body limit: 1MB. File upload limit: 10MB
- Prompt injection patterns are stripped before LLM calls
