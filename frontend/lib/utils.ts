import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Recommendation, Confidence, CriterionStatus } from './types'
import type { PreAuthSkillOutput } from './types'

// ── Tailwind class merger ──────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Recommendation → colors ───────────────────────────────
// Note: 'ERROR' is included for validation results that failed to process
export type RecommendationWithStatus = Recommendation | 'ERROR'

export const RECOMMENDATION_BG: Record<Recommendation, string> = {
  LIKELY_APPROVE: 'bg-blue-600',
  NEED_MORE_INFO: 'bg-yellow-500',
  LIKELY_DENY:    'bg-purple-600',
}

export const RECOMMENDATION_GRADIENT: Record<Recommendation, string> = {
  LIKELY_APPROVE: 'from-emerald-500 via-emerald-600 to-green-700',
  NEED_MORE_INFO: 'from-amber-500 via-amber-600 to-orange-600',
  LIKELY_DENY:    'from-rose-500 via-rose-600 to-red-700',
}

export const RECOMMENDATION_BORDER: Record<Recommendation, string> = {
  LIKELY_APPROVE: 'border-blue-600',
  NEED_MORE_INFO: 'border-yellow-500',
  LIKELY_DENY:    'border-purple-600',
}

export const RECOMMENDATION_TEXT_COLOR: Record<Recommendation, string> = {
  LIKELY_APPROVE: 'text-blue-700',
  NEED_MORE_INFO: 'text-yellow-600',
  LIKELY_DENY:    'text-purple-700',
}

export const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  LIKELY_APPROVE: 'Likely Approve',
  NEED_MORE_INFO: 'Needs More Information',
  LIKELY_DENY:    'Likely Deny',
}

// Helper to safely get label for validation results that may include 'ERROR'
export function getRecommendationLabel(value: Recommendation | 'ERROR'): string {
  if (value === 'ERROR') return 'Error'
  return RECOMMENDATION_LABEL[value]
}

// Helper to safely get text color for validation results that may include 'ERROR'
export function getRecommendationTextColor(value: Recommendation | 'ERROR'): string {
  if (value === 'ERROR') return 'text-[var(--muted-foreground)]'
  return RECOMMENDATION_TEXT_COLOR[value]
}

// ── Confidence → colors ───────────────────────────────────
export const CONFIDENCE_BADGE: Record<Confidence, string> = {
  HIGH:   'bg-green-100 text-green-800 border border-green-300',
  MEDIUM: 'bg-amber-100 text-amber-800 border border-amber-300',
  LOW:    'bg-red-100   text-red-800   border border-red-300',
}

// ── Criterion status → colors ─────────────────────────────
export const STATUS_BADGE: Record<CriterionStatus, string> = {
  MET:     'bg-green-100 text-green-800',
  PARTIAL: 'bg-amber-100 text-amber-800',
  UNMET:   'bg-red-100   text-red-800',
  'N/A':   'bg-gray-100  text-gray-600',
}

export const STATUS_CIRCLE: Record<CriterionStatus, string> = {
  MET:     'bg-green-500 text-white',
  PARTIAL: 'bg-amber-500 text-white',
  UNMET:   'bg-red-500 text-white',
  'N/A':   'bg-gray-400 text-white',
}

export const STATUS_BORDER_L: Record<CriterionStatus, string> = {
  MET:     'border-l-green-500',
  PARTIAL: 'border-l-amber-400',
  UNMET:   'border-l-red-500',
  'N/A':   'border-l-gray-300',
}

// ── Source → consistent pill color ───────────────────────
// Same source always gets same color for visual traceability.
// Uses deterministic hash-based color assignment to avoid SSR/client hydration mismatches.
const SOURCE_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
  'bg-teal-100 text-teal-800',
  'bg-orange-100 text-orange-800',
  'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800',
]

/**
 * Deterministically map a string to a color index using a simple hash.
 * This ensures consistent colors across server and client renders.
 */
function _hashStringToIndex(str: string, max: number): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash) % max
}

export function getSourceColor(source: string): string {
  const key = source.toLowerCase().split('(')[0].trim() // normalize
  const colorIndex = _hashStringToIndex(key, SOURCE_COLORS.length)
  return SOURCE_COLORS[colorIndex]
}

// ── Time formatters ───────────────────────────────────────
export function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
}

// ── File export ───────────────────────────────────────────
export function exportJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const VERDICT_HTML_CLASS: Record<Recommendation, string> = {
  LIKELY_APPROVE: 'verdict-approve',
  NEED_MORE_INFO: 'verdict-info',
  LIKELY_DENY: 'verdict-deny',
}

const STATUS_HTML_CLASS: Record<CriterionStatus, string> = {
  MET: 'status-met',
  PARTIAL: 'status-partial',
  UNMET: 'status-unmet',
  'N/A': 'status-na',
}

function pctScore(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${Math.round(value * 100)}%`
}

export function exportMarkdownFile(output: PreAuthSkillOutput, filename: string): void {
  const blob = new Blob([buildMarkdownReport(output)], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function buildHtmlReport(output: PreAuthSkillOutput): string {
  const title = `PreAuthIQ Report — ${output.case_id}`
  const criteriaRows = output.criteria_results
    .map(
      (c) => `
      <tr>
        <td>${escapeHtml(c.criterion_id)}</td>
        <td>${escapeHtml(c.criterion_name)}</td>
        <td><span class="badge ${STATUS_HTML_CLASS[c.status]}">${escapeHtml(c.status)}</span></td>
        <td>${escapeHtml(c.supporting_evidence || '—')}</td>
        <td>${escapeHtml(c.gap_or_risk || '—')}</td>
      </tr>`
    )
    .join('')

  const evidenceItems = output.supporting_evidence.length
    ? output.supporting_evidence
        .map(
          (e) =>
            `<li><strong>${escapeHtml(e.source)}:</strong> ${escapeHtml(e.excerpt)}</li>`
        )
        .join('')
    : '<li>No supporting evidence snippets recorded.</li>'

  const missingItems = output.missing_information.length
    ? output.missing_information.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
    : ''

  const auditFlags = (output.audit_flags ?? [])
    .map((flag) => `<li>${escapeHtml(flag)}</li>`)
    .join('')

  const validation = output.validation_insights
  const validationBlock = validation
    ? `
      <section>
        <h2>Data Quality</h2>
        <p><strong>Quality Score:</strong> ${Math.round(validation.quality_score * 100)}%</p>
        ${
          validation.required_field_issues.length
            ? `<h3>Field Issues</h3><ul>${validation.required_field_issues
                .map((issue) => `<li>${escapeHtml(issue)}</li>`)
                .join('')}</ul>`
            : ''
        }
        ${
          validation.enrichment_hints.length
            ? `<h3>Enrichment Hints</h3><ul>${validation.enrichment_hints
                .map((hint) => `<li>${escapeHtml(hint)}</li>`)
                .join('')}</ul>`
            : ''
        }
      </section>`
    : ''

  const auditBlock =
    output.consistency_score != null ||
    output.contradiction_risk_index != null ||
    output.appeal_readiness_score != null
      ? `
      <section>
        <h2>QA Audit Scores</h2>
        <div class="audit-grid">
          <div class="audit-card"><span>Consistency</span><strong>${pctScore(output.consistency_score)}</strong></div>
          <div class="audit-card"><span>Contradiction Risk</span><strong>${pctScore(output.contradiction_risk_index)}</strong></div>
          <div class="audit-card"><span>Appeal Readiness</span><strong>${pctScore(output.appeal_readiness_score)}</strong></div>
        </div>
        ${auditFlags ? `<ul>${auditFlags}</ul>` : ''}
      </section>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; color: #111; margin: 32px; line-height: 1.5; font-size: 13px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    h2 { font-size: 15px; margin-top: 24px; border-bottom: 1px solid #ddd; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
    h3 { font-size: 13px; margin-top: 12px; }
    .meta { color: #555; margin-bottom: 16px; }
    .verdict { display: inline-block; padding: 6px 12px; border-radius: 6px; font-weight: bold; margin: 8px 0 16px; }
    .verdict-approve { background: #dcfce7; color: #166534; }
    .verdict-info { background: #fef9c3; color: #854d0e; }
    .verdict-deny { background: #fee2e2; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; text-align: left; }
    th { background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .status-met { background: #dcfce7; color: #166534; }
    .status-partial { background: #fef9c3; color: #854d0e; }
    .status-unmet { background: #fee2e2; color: #991b1b; }
    .status-na { background: #f1f5f9; color: #475569; }
    .audit-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 8px; }
    .audit-card { border: 1px solid #ddd; border-radius: 8px; padding: 10px; }
    .audit-card span { display: block; font-size: 11px; color: #64748b; }
    .audit-card strong { font-size: 18px; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ddd; color: #64748b; font-size: 11px; }
    @media print {
      body { margin: 16px; }
      section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta"><strong>Service:</strong> ${escapeHtml(output.requested_service)}</p>
  <p class="verdict ${VERDICT_HTML_CLASS[output.recommendation]}">
    ${escapeHtml(RECOMMENDATION_LABEL[output.recommendation])} · Confidence: ${escapeHtml(output.confidence)}
  </p>

  <section>
    <h2>Clinical Summary</h2>
    <p>${escapeHtml(output.clinical_summary)}</p>
  </section>

  <section>
    <h2>Criteria Summary</h2>
    <p><strong>Met:</strong> ${escapeHtml(output.criteria_met.join(', ') || 'None')}</p>
    <p><strong>Partial / Unmet:</strong> ${escapeHtml(output.criteria_partial_or_unmet.join(', ') || 'None')}</p>
  </section>

  <section>
    <h2>Criteria Evaluation</h2>
    <table>
      <thead>
        <tr><th>ID</th><th>Criterion</th><th>Status</th><th>Evidence</th><th>Gap / Risk</th></tr>
      </thead>
      <tbody>${criteriaRows}</tbody>
    </table>
  </section>

  <section>
    <h2>Supporting Evidence</h2>
    <ul>${evidenceItems}</ul>
  </section>

  ${validationBlock}
  ${auditBlock}

  ${
    missingItems
      ? `<section><h2>Missing Information</h2><ul>${missingItems}</ul></section>`
      : ''
  }
  ${
    output.provider_query
      ? `<section><h2>Provider Query</h2><p>${escapeHtml(output.provider_query)}</p></section>`
      : ''
  }
  ${
    output.flip_condition
      ? `<section><h2>What Would Flip This to Approval</h2><p>${escapeHtml(output.flip_condition)}</p></section>`
      : ''
  }
  ${
    output.appeal_direction
      ? `<section><h2>Appeal Direction</h2><p>${escapeHtml(output.appeal_direction)}</p></section>`
      : ''
  }

  <p class="footer">
    Processed in ${escapeHtml(formatMs(output.processing_time_ms))}
    (extraction ${escapeHtml(formatMs(output.step1_time_ms))}, adjudication ${escapeHtml(formatMs(output.step2_time_ms))})
    using ${escapeHtml(output.model_used)}.
  </p>
</body>
</html>`
}

export function exportReportPdf(output: PreAuthSkillOutput): void {
  const popup = window.open('', '_blank', 'width=900,height=700')
  if (!popup) return
  popup.document.write(buildHtmlReport(output))
  popup.document.close()
  popup.focus()
  popup.print()
}

// ── Markdown report generator (for Copy Report button) ───
export function buildMarkdownReport(output: PreAuthSkillOutput): string {
  const lines: string[] = [
    `# Pre-Authorization Review — ${output.case_id}`,
    `**Service:** ${output.requested_service}`,
    `**Recommendation:** ${RECOMMENDATION_LABEL[output.recommendation]}`,
    `**Confidence:** ${output.confidence}`,
    '',
    '## Clinical Summary',
    output.clinical_summary,
    '',
    '## Criteria Summary',
    `- **Met:** ${output.criteria_met.join(', ') || 'None'}`,
    `- **Partial / Unmet:** ${output.criteria_partial_or_unmet.join(', ') || 'None'}`,
    '',
    '## Criteria Evaluation',
  ]

  for (const c of output.criteria_results) {
    lines.push(`### ${c.criterion_id}: ${c.criterion_name} — ${c.status}`)
    if (c.supporting_evidence) lines.push(`**Evidence:** ${c.supporting_evidence}`)
    if (c.gap_or_risk) lines.push(`**Gap/Risk:** ${c.gap_or_risk}`)
    lines.push('')
  }

  if (output.supporting_evidence.length > 0) {
    lines.push('## Supporting Evidence')
    for (const e of output.supporting_evidence) {
      lines.push(`- **${e.source}:** ${e.excerpt}`)
    }
    lines.push('')
  }

  if (output.validation_insights) {
    const vi = output.validation_insights
    lines.push('## Data Quality')
    lines.push(`- **Quality Score:** ${Math.round(vi.quality_score * 100)}%`)
    if (vi.required_field_issues.length > 0) {
      lines.push('- **Field Issues:**')
      for (const issue of vi.required_field_issues) {
        lines.push(`  - ${issue}`)
      }
    }
    if (vi.enrichment_hints.length > 0) {
      lines.push('- **Enrichment Hints:**')
      for (const hint of vi.enrichment_hints) {
        lines.push(`  - ${hint}`)
      }
    }
    lines.push('')
  }

  const hasAuditScores =
    output.consistency_score != null ||
    output.contradiction_risk_index != null ||
    output.appeal_readiness_score != null

  if (hasAuditScores) {
    lines.push('## QA Audit Scores')
    if (output.consistency_score != null) {
      lines.push(`- **Consistency Score:** ${pctScore(output.consistency_score)}`)
    }
    if (output.contradiction_risk_index != null) {
      lines.push(`- **Contradiction Risk:** ${pctScore(output.contradiction_risk_index)}`)
    }
    if (output.appeal_readiness_score != null) {
      lines.push(`- **Appeal Readiness:** ${pctScore(output.appeal_readiness_score)}`)
    }
    if (output.audit_flags && output.audit_flags.length > 0) {
      lines.push('- **Audit Flags:**')
      for (const flag of output.audit_flags) {
        lines.push(`  - ${flag}`)
      }
    }
    lines.push('')
  }

  if (output.missing_information.length > 0) {
    lines.push('## Missing Information')
    for (const item of output.missing_information) {
      lines.push(`- ${item}`)
    }
    lines.push('')
  }

  if (output.provider_query) {
    lines.push('## Provider Query')
    lines.push(output.provider_query)
    lines.push('')
  }

  if (output.flip_condition) {
    lines.push('## What Would Flip This to Approval')
    lines.push(output.flip_condition)
    lines.push('')
  }

  if (output.appeal_direction) {
    lines.push('## Appeal Direction')
    lines.push(output.appeal_direction)
    lines.push('')
  }

  lines.push('---')
  lines.push(
    `*Analyzed in ${formatMs(output.processing_time_ms)} ` +
      `(extraction ${formatMs(output.step1_time_ms)}, adjudication ${formatMs(output.step2_time_ms)}) ` +
      `using ${output.model_used}*`
  )

  return lines.join('\n')
}