import type { TrainingCase } from './types'

/** Mirror of backend/core/training_notes.build_expanded_clinical_notes */
export function buildExpandedClinicalNotes(tc: TrainingCase): string {
  if (tc.expanded_clinical_notes?.trim()) {
    return tc.expanded_clinical_notes.trim()
  }

  const sections = [
    '=== STRUCTURED CLINICAL PACKET (TRAINING CASE) ===',
    `Case ID: ${tc.case_id}`,
    `Requested Service: ${tc.requested_service}`,
    '',
    'Clinical Scenario:',
    tc.clinical_scenario,
    '',
    'Supporting Evidence Documented in Chart:',
    tc.key_supporting_evidence,
    '',
    'Documentation Gaps / Clinical Risks:',
    tc.key_gaps_or_risks,
    '',
    'Clinical Rationale Summary:',
    tc.why,
    '',
    'If Additional Documentation Arrives:',
    tc.if_additional_documentation_arrives ?? 'N/A',
  ]

  if (tc.complexity_notes) {
    sections.push('', 'Reviewer Complexity Notes:', tc.complexity_notes)
  }

  return sections.join('\n').trim()
}
