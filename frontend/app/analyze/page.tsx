'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { PreAuthCaseInput, SchemaField } from '@/lib/types'
import { fetchInputSchema } from '@/lib/api'
import { useReview } from '@/hooks/useReview'
import { FieldTooltip } from '@/components/form/FieldTooltip'
import { IntakeSectionPanel } from '@/components/form/IntakeSectionPanel'
import { RawNotesInput } from '@/components/form/RawNotesInput'
import {
  BeakerIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  HeartIcon,
  ShieldCheckIcon,
  UserIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { getTooltipForField } from '@/lib/fieldGroups'
import { INTAKE_FIELDS, INTAKE_SECTIONS } from '@/lib/formFieldCopy'

// ── Helper sub-component for standard text fields ──────────
function Field({
  label,
  tooltip,
  value,
  onChange,
  required,
  hint,
  type = 'text',
}: {
  label: string
  tooltip?: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  hint?: string
  type?: string
}) {
  return (
    <div>
      <label className="form-field-label">
        <span>{label}</span>
        {required && <span className="text-red-500 normal-case">required</span>}
        {tooltip && <FieldTooltip text={tooltip} />}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={hint}
        className="premium-input"
      />
    </div>
  )
}

// ── SourcedField sub-component ─────────────────────────────
function SourcedFieldInput({
  copy,
  tooltip,
  value,
  source,
  onValueChange,
  onSourceChange,
}: {
  copy: { label: string; hint: string; sourceLabel: string; sourceHint: string }
  tooltip?: string
  value: string
  source: string
  onValueChange: (v: string) => void
  onSourceChange: (v: string) => void
}) {
  return (
    <div className="md:col-span-2">
      <label className="form-field-label">
        <span>{copy.label}</span>
        {tooltip && <FieldTooltip text={tooltip} />}
      </label>
      <textarea
        value={value}
        onChange={e => onValueChange(e.target.value)}
        rows={2}
        placeholder={copy.hint}
        className="premium-textarea"
      />
      <span className="form-field-sublabel">{copy.sourceLabel}</span>
      <input
        type="text"
        value={source}
        onChange={e => onSourceChange(e.target.value)}
        placeholder={copy.sourceHint}
        className="premium-input"
      />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function AnalyzePage() {
  const router = useRouter()
  const { analyze, isLoading, error, loadingStep } = useReview()
  const [schema, setSchema] = useState<SchemaField[]>([])
  const [schemaError, setSchemaError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState('')

  // Form state — all fields
  const [form, setForm] = useState({
    // Coverage
    payer_plan: '', requested_service: '', site_of_care: '',
    requested_los: '', payer_policy_excerpt: '',
    // Demographics
    age: '', sex: '',
    // Diagnosis
    primary_diagnosis: '', secondary_diagnoses: '',
    // Clinical Severity
    symptom_duration: '', pain_severity: '',
    adl_value: '', adl_source: '',
    neuro_value: '', neuro_source: '',
    // History & Medication
    prior_conservative_treatment: '', response_to_prior_treatment: '',
    prior_surgeries_procedures: '', current_medications: '',
    medication_contraindications: '',
    // Diagnostics
    imaging_value: '', imaging_source: '',
    lab_results: '', pathology_biopsy: '', specialized_tests: '',
    // Utilization & Admin
    complications_red_flags: '', required_prerequisites: '',
    missing_records: '', contradictory_flags: '', known_exclusions_present: '',
    utilization_review_note: '',
    // Raw notes
    raw_clinical_notes: '',
  })

  useEffect(() => {
    fetchInputSchema()
      .then(setSchema)
      .catch(err => {
        setSchemaError('Failed to load schema. Tooltips may be limited.')
        console.error('Schema load error:', err)
      })
  }, [])

  function getTooltip(fieldName: string): string {
    return getTooltipForField(schema, fieldName)
  }

  function set(key: keyof typeof form) {
    return (v: string) => setForm(prev => ({ ...prev, [key]: v }))
  }

  function handleReset() {
    setForm(Object.fromEntries(Object.keys(form).map(k => [k, ''])) as typeof form)
    setValidationError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError('')

    if (!form.requested_service.trim()) {
      setValidationError('Requested Service is required.')
      return
    }
    if (!form.primary_diagnosis.trim()) {
      setValidationError('Primary Diagnosis is required.')
      return
    }

    const input: PreAuthCaseInput = {
      payer_plan: form.payer_plan || undefined,
      requested_service: form.requested_service,
      site_of_care: form.site_of_care || undefined,
      requested_los: form.requested_los || undefined,
      payer_policy_excerpt: form.payer_policy_excerpt || undefined,
      age: form.age ? parseInt(form.age) : undefined,
      sex: form.sex || undefined,
      primary_diagnosis: form.primary_diagnosis,
      secondary_diagnoses: form.secondary_diagnoses ? form.secondary_diagnoses.split(';').map(s => s.trim()).filter(Boolean) : undefined,
      symptom_duration: form.symptom_duration || undefined,
      pain_severity: form.pain_severity || undefined,
      functional_impairment_adls: form.adl_value ? { value: form.adl_value, source: form.adl_source || undefined } : undefined,
      objective_neurologic_deficits: form.neuro_value ? { value: form.neuro_value, source: form.neuro_source || undefined } : undefined,
      prior_conservative_treatment: form.prior_conservative_treatment ? form.prior_conservative_treatment.split(';').map(s => s.trim()).filter(Boolean) : undefined,
      response_to_prior_treatment: form.response_to_prior_treatment || undefined,
      prior_surgeries_procedures: form.prior_surgeries_procedures || undefined,
      current_medications: form.current_medications ? form.current_medications.split(';').map(s => s.trim()).filter(Boolean) : undefined,
      medication_contraindications: form.medication_contraindications || undefined,
      imaging_findings: form.imaging_value ? { value: form.imaging_value, source: form.imaging_source || undefined } : undefined,
      lab_results: form.lab_results || undefined,
      pathology_biopsy: form.pathology_biopsy || undefined,
      specialized_tests: form.specialized_tests || undefined,
      complications_red_flags: form.complications_red_flags || undefined,
      required_prerequisites: form.required_prerequisites || undefined,
      missing_records: form.missing_records || undefined,
      contradictory_flags: form.contradictory_flags || undefined,
      known_exclusions_present: form.known_exclusions_present || undefined,
      utilization_review_note: form.utilization_review_note || undefined,
      raw_clinical_notes: form.raw_clinical_notes || undefined,
    }

    const output = await analyze(input)
    if (output) router.push('/report')
  }

  if (isLoading) return <LoadingSpinner step={loadingStep} />

  return (
    <div className="responsive-container">
      <div className="page-header mb-5">
        <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
          Clinical Review Intake
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Complete each section below — fields marked <span className="text-red-500 font-medium">required</span> must be filled before review.
        </p>
      </div>

      {validationError && (
        <div className="mb-4">
          <ErrorAlert message={validationError} />
        </div>
      )}
      {schemaError && (
        <div className="mb-4">
          <ErrorAlert message={schemaError} />
        </div>
      )}
      {error && (
        <div className="mb-4">
          <ErrorAlert message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="intake-panel-stack">
        <IntakeSectionPanel
          index={1}
          title={INTAKE_SECTIONS.coverage.title}
          description={INTAKE_SECTIONS.coverage.description}
          icon={DocumentTextIcon}
          accent="emerald"
        >
          <Field label={INTAKE_FIELDS.payer_plan.label} hint={INTAKE_FIELDS.payer_plan.hint} tooltip={getTooltip('payer')} value={form.payer_plan} onChange={set('payer_plan')} />
          <Field label={INTAKE_FIELDS.requested_service.label} hint={INTAKE_FIELDS.requested_service.hint} tooltip={getTooltip('requested service')} value={form.requested_service} onChange={set('requested_service')} required />
          <Field label={INTAKE_FIELDS.site_of_care.label} hint={INTAKE_FIELDS.site_of_care.hint} tooltip={getTooltip('site of care')} value={form.site_of_care} onChange={set('site_of_care')} />
          <Field label={INTAKE_FIELDS.requested_los.label} hint={INTAKE_FIELDS.requested_los.hint} tooltip={getTooltip('length of stay')} value={form.requested_los} onChange={set('requested_los')} />
          <div className="md:col-span-2">
            <label className="form-field-label">
              <span>{INTAKE_FIELDS.payer_policy_excerpt.label}</span>
              <FieldTooltip text="Paste relevant policy text if available. The system will extract approval criteria." />
            </label>
            <textarea value={form.payer_policy_excerpt} onChange={e => set('payer_policy_excerpt')(e.target.value)} rows={2} className="premium-textarea" placeholder={INTAKE_FIELDS.payer_policy_excerpt.hint} />
          </div>
        </IntakeSectionPanel>

        <IntakeSectionPanel
          index={2}
          title={INTAKE_SECTIONS.demographics.title}
          description={INTAKE_SECTIONS.demographics.description}
          icon={UserIcon}
          accent="teal"
        >
          <Field label={INTAKE_FIELDS.age.label} hint={INTAKE_FIELDS.age.hint} tooltip={getTooltip('age')} value={form.age} onChange={set('age')} type="number" />
          <Field label={INTAKE_FIELDS.sex.label} hint={INTAKE_FIELDS.sex.hint} tooltip={getTooltip('sex')} value={form.sex} onChange={set('sex')} />
        </IntakeSectionPanel>

        <IntakeSectionPanel
          index={3}
          title={INTAKE_SECTIONS.diagnosis.title}
          description={INTAKE_SECTIONS.diagnosis.description}
          icon={HeartIcon}
          accent="rose"
        >
          <Field label={INTAKE_FIELDS.primary_diagnosis.label} hint={INTAKE_FIELDS.primary_diagnosis.hint} tooltip={getTooltip('primary diagnosis')} value={form.primary_diagnosis} onChange={set('primary_diagnosis')} required />
          <Field label={INTAKE_FIELDS.secondary_diagnoses.label} hint={INTAKE_FIELDS.secondary_diagnoses.hint} tooltip={getTooltip('secondary')} value={form.secondary_diagnoses} onChange={set('secondary_diagnoses')} />
        </IntakeSectionPanel>

        <IntakeSectionPanel
          index={4}
          title={INTAKE_SECTIONS.clinical.title}
          description={INTAKE_SECTIONS.clinical.description}
          icon={BeakerIcon}
          accent="violet"
        >
          <Field label={INTAKE_FIELDS.symptom_duration.label} hint={INTAKE_FIELDS.symptom_duration.hint} tooltip={getTooltip('symptom duration')} value={form.symptom_duration} onChange={set('symptom_duration')} />
          <Field label={INTAKE_FIELDS.pain_severity.label} hint={INTAKE_FIELDS.pain_severity.hint} tooltip={getTooltip('pain severity')} value={form.pain_severity} onChange={set('pain_severity')} />
          <SourcedFieldInput
            copy={INTAKE_FIELDS.adl}
            tooltip={getTooltip('functional impairment')}
            value={form.adl_value}
            source={form.adl_source}
            onValueChange={set('adl_value')}
            onSourceChange={set('adl_source')}
          />
          <SourcedFieldInput
            copy={INTAKE_FIELDS.neuro}
            tooltip={getTooltip('neurologic')}
            value={form.neuro_value}
            source={form.neuro_source}
            onValueChange={set('neuro_value')}
            onSourceChange={set('neuro_source')}
          />
        </IntakeSectionPanel>

        <IntakeSectionPanel
          index={5}
          title={INTAKE_SECTIONS.history.title}
          description={INTAKE_SECTIONS.history.description}
          icon={ClipboardDocumentListIcon}
          accent="amber"
        >
          <Field label={INTAKE_FIELDS.prior_conservative_treatment.label} hint={INTAKE_FIELDS.prior_conservative_treatment.hint} tooltip={getTooltip('conservative')} value={form.prior_conservative_treatment} onChange={set('prior_conservative_treatment')} />
          <Field label={INTAKE_FIELDS.response_to_prior_treatment.label} hint={INTAKE_FIELDS.response_to_prior_treatment.hint} tooltip={getTooltip('response')} value={form.response_to_prior_treatment} onChange={set('response_to_prior_treatment')} />
          <Field label={INTAKE_FIELDS.prior_surgeries_procedures.label} hint={INTAKE_FIELDS.prior_surgeries_procedures.hint} tooltip={getTooltip('surgeries')} value={form.prior_surgeries_procedures} onChange={set('prior_surgeries_procedures')} />
          <Field label={INTAKE_FIELDS.current_medications.label} hint={INTAKE_FIELDS.current_medications.hint} tooltip={getTooltip('medication')} value={form.current_medications} onChange={set('current_medications')} />
          <Field label={INTAKE_FIELDS.medication_contraindications.label} hint={INTAKE_FIELDS.medication_contraindications.hint} tooltip={getTooltip('contraindication')} value={form.medication_contraindications} onChange={set('medication_contraindications')} />
        </IntakeSectionPanel>

        <IntakeSectionPanel
          index={6}
          title={INTAKE_SECTIONS.diagnostics.title}
          description={INTAKE_SECTIONS.diagnostics.description}
          icon={WrenchScrewdriverIcon}
          accent="sky"
        >
          <SourcedFieldInput
            copy={INTAKE_FIELDS.imaging}
            tooltip={getTooltip('imaging')}
            value={form.imaging_value}
            source={form.imaging_source}
            onValueChange={set('imaging_value')}
            onSourceChange={set('imaging_source')}
          />
          <Field label={INTAKE_FIELDS.lab_results.label} hint={INTAKE_FIELDS.lab_results.hint} tooltip={getTooltip('lab')} value={form.lab_results} onChange={set('lab_results')} />
          <Field label={INTAKE_FIELDS.pathology_biopsy.label} hint={INTAKE_FIELDS.pathology_biopsy.hint} tooltip={getTooltip('pathology')} value={form.pathology_biopsy} onChange={set('pathology_biopsy')} />
          <Field label={INTAKE_FIELDS.specialized_tests.label} hint={INTAKE_FIELDS.specialized_tests.hint} tooltip={getTooltip('specialized')} value={form.specialized_tests} onChange={set('specialized_tests')} />
        </IntakeSectionPanel>

        <IntakeSectionPanel
          index={7}
          title={INTAKE_SECTIONS.utilization.title}
          description={INTAKE_SECTIONS.utilization.description}
          icon={ShieldCheckIcon}
          accent="slate"
        >
          <Field label={INTAKE_FIELDS.complications_red_flags.label} hint={INTAKE_FIELDS.complications_red_flags.hint} tooltip={getTooltip('complications')} value={form.complications_red_flags} onChange={set('complications_red_flags')} />
          <Field label={INTAKE_FIELDS.required_prerequisites.label} hint={INTAKE_FIELDS.required_prerequisites.hint} tooltip={getTooltip('prerequisites')} value={form.required_prerequisites} onChange={set('required_prerequisites')} />
          <Field label={INTAKE_FIELDS.missing_records.label} hint={INTAKE_FIELDS.missing_records.hint} tooltip={getTooltip('missing')} value={form.missing_records} onChange={set('missing_records')} />
          <Field label={INTAKE_FIELDS.contradictory_flags.label} hint={INTAKE_FIELDS.contradictory_flags.hint} tooltip={getTooltip('contradict')} value={form.contradictory_flags} onChange={set('contradictory_flags')} />
          <Field label={INTAKE_FIELDS.known_exclusions_present.label} hint={INTAKE_FIELDS.known_exclusions_present.hint} value={form.known_exclusions_present} onChange={set('known_exclusions_present')} />
          <div className="md:col-span-2">
            <label className="form-field-label">
              <span>{INTAKE_FIELDS.utilization_review_note.label}</span>
              <FieldTooltip text="Paste any prior UR assessment, denial letter, or pend conditions here." />
            </label>
            <textarea value={form.utilization_review_note} onChange={e => set('utilization_review_note')(e.target.value)} rows={2} className="premium-textarea" placeholder={INTAKE_FIELDS.utilization_review_note.hint} />
          </div>
        </IntakeSectionPanel>

        <IntakeSectionPanel
          index={8}
          title={INTAKE_SECTIONS.rawNotes.title}
          description={INTAKE_SECTIONS.rawNotes.description}
          icon={DocumentTextIcon}
          accent="lime"
        >
          <div className="md:col-span-2">
            <RawNotesInput
              value={form.raw_clinical_notes}
              onChange={set('raw_clinical_notes')}
            />
          </div>
        </IntakeSectionPanel>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 premium-button-primary"
          >
            Run Review
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="premium-button-secondary"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  )
}