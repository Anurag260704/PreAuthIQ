/**
 * Intake form copy — labels (what to enter) vs hints (example values).
 * Labels use schema-oriented wording; placeholders use sample chart language.
 */

export type FieldCopy = {
  label: string
  hint: string
}

export type SourcedFieldCopy = FieldCopy & {
  sourceLabel: string
  sourceHint: string
}

export const INTAKE_SECTIONS = {
  coverage: {
    title: 'Plan & Authorization',
    description: 'Payer context, requested service, and policy references.',
  },
  demographics: {
    title: 'Patient Profile',
    description: 'Age and recorded sex used in criteria checks.',
  },
  diagnosis: {
    title: 'Problem & Comorbidities',
    description: 'Principal diagnosis and related conditions.',
  },
  clinical: {
    title: 'Presentation & Impact',
    description: 'Symptoms, daily function, and objective exam findings.',
  },
  history: {
    title: 'Prior Treatment',
    description: 'Conservative care, procedures, medications, and response.',
  },
  diagnostics: {
    title: 'Studies & Results',
    description: 'Imaging, labs, pathology, and ancillary test summaries.',
  },
  utilization: {
    title: 'Packet & UR Review',
    description: 'Gaps, contradictions, prerequisites, and UR history.',
  },
  rawNotes: {
    title: 'Chart Excerpts',
    description: 'Paste free-text notes for structured extraction.',
  },
} as const

export const INTAKE_FIELDS = {
  payer_plan: {
    label: 'Plan & line of business',
    hint: 'Commercial PPO · Medicare Advantage · etc.',
  },
  requested_service: {
    label: 'Requested procedure / service',
    hint: 'C5–C6 cervical decompression and fusion',
  },
  site_of_care: {
    label: 'Intended care setting',
    hint: 'Inpatient · outpatient · ASC',
  },
  requested_los: {
    label: 'Expected length of stay',
    hint: '2 midnights · same-day · 23-hour obs',
  },
  payer_policy_excerpt: {
    label: 'Applicable policy excerpt',
    hint: 'Paste medical-necessity or spine policy section…',
  },
  age: {
    label: 'Patient age (years)',
    hint: '58',
  },
  sex: {
    label: 'Recorded sex',
    hint: 'Male · Female · Other',
  },
  primary_diagnosis: {
    label: 'Principal diagnosis',
    hint: 'Cervical spondylotic myelopathy with radiculopathy',
  },
  secondary_diagnoses: {
    label: 'Secondary / comorbid conditions',
    hint: 'Type 2 diabetes; OSA on CPAP — separate with semicolons',
  },
  symptom_duration: {
    label: 'Symptom timeline',
    hint: '8 months progressive hand numbness',
  },
  pain_severity: {
    label: 'Reported pain intensity',
    hint: '8/10, worse with neck extension',
  },
  adl: {
    label: 'Functional decline (ADLs)',
    hint: 'Difficulty buttoning, unsafe on stairs, reduced productivity',
    sourceLabel: 'Source document for ADLs',
    sourceHint: 'PT discharge note · HPI · surgeon consult (date)',
  },
  neuro: {
    label: 'Objective neurologic findings',
    hint: 'Hoffmann positive, grip 4/5, C6 sensory loss',
    sourceLabel: 'Source document for exam',
    sourceHint: 'Neurology consult · surgeon exam · PCP note',
  },
  prior_conservative_treatment: {
    label: 'Conservative therapy attempted',
    hint: '10 wk PT; NSAIDs; gabapentin; cervical ESI',
  },
  response_to_prior_treatment: {
    label: 'Outcome of prior therapy',
    hint: 'Transient relief <2 weeks; clumsiness worsened with PT',
  },
  prior_surgeries_procedures: {
    label: 'Prior operative history',
    hint: 'None prior spine surgery · or list prior procedures',
  },
  current_medications: {
    label: 'Active medication list',
    hint: 'Metformin; atorvastatin; gabapentin — semicolon-separated',
  },
  medication_contraindications: {
    label: 'Allergies / intolerances / contraindications',
    hint: 'Opioid nausea; no true drug allergy documented',
  },
  imaging: {
    label: 'Key imaging interpretation',
    hint: 'Severe C5–C6 stenosis, cord compression, T2 signal change',
    sourceLabel: 'Imaging source',
    sourceHint: 'MRI cervical spine report (date)',
  },
  lab_results: {
    label: 'Laboratory data',
    hint: 'A1c 7.8 · CBC within normal limits',
  },
  pathology_biopsy: {
    label: 'Pathology / culture / biopsy',
    hint: 'Not applicable · or summarize result',
  },
  specialized_tests: {
    label: 'Other diagnostic studies',
    hint: 'EMG/NCS · pulmonary function · etc.',
  },
  complications_red_flags: {
    label: 'Acute warnings / recent events',
    hint: 'Two near-falls in past month; gait instability',
  },
  required_prerequisites: {
    label: 'Prerequisites met',
    hint: 'MRI on file · neuro consult completed',
  },
  missing_records: {
    label: 'Documentation gaps in packet',
    hint: 'Latest surgeon note lacks explicit ADL wording',
  },
  contradictory_flags: {
    label: 'Conflicting chart statements',
    hint: 'PCP: strength intact (3 mo ago) vs neuro: hyperreflexia (recent)',
  },
  known_exclusions_present: {
    label: 'Policy exclusion flags',
    hint: 'None identified · or describe exclusion concern',
  },
  utilization_review_note: {
    label: 'Prior UR / denial context',
    hint: 'Paste pend letter, denial rationale, or internal UR note…',
  },
} as const
