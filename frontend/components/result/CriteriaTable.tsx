import type { CriterionResult } from '@/lib/types'
import { STATUS_BADGE, STATUS_CIRCLE, STATUS_BORDER_L } from '@/lib/utils'
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'

interface CriteriaTableProps {
  criteria: CriterionResult[]
}

export function CriteriaTable({ criteria }: CriteriaTableProps) {
  if (criteria.length === 0) return null

  return (
    <div className="report-section">
      <div className="flex items-center gap-2 mb-5">
        <ClipboardDocumentCheckIcon className="h-5 w-5 text-[var(--primary)]" />
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">
          Criteria Evaluation
        </h3>
        <span className="ml-auto rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted-foreground)]">
          {criteria.length} criteria
        </span>
      </div>

      <div className="space-y-1">
        {criteria.map((c, i) => (
          <div
            key={c.criterion_id}
            className={`criteria-row ${STATUS_BORDER_L[c.status]} rounded-r-lg bg-[var(--muted)]/20 hover:bg-[var(--muted)]/40 transition-colors`}
          >
            <div className="flex items-start gap-3">
              {/* Status circle */}
              <span className={`mt-0.5 shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${STATUS_CIRCLE[c.status]}`}>
                {i + 1}
              </span>

              <div className="flex-1 min-w-0">
                {/* Criterion name + status badge */}
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {c.criterion_name}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[c.status]}`}>
                    {c.status}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)] font-mono">{c.criterion_id}</span>
                </div>

                {/* Supporting evidence */}
                {c.supporting_evidence && (
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                    {c.supporting_evidence}
                  </p>
                )}

                {/* Gap or risk */}
                {c.gap_or_risk && (
                  <p className="mt-1 text-xs text-amber-600 font-medium">
                    ⚠ {c.gap_or_risk}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
