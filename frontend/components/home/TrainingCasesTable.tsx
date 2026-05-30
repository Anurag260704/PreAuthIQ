'use client'

import { useState } from 'react'
import type { TrainingCase, ValidationSummary } from '@/lib/types'
import { getRecommendationLabel, getRecommendationTextColor } from '@/lib/utils'
import { runValidationStream } from '@/lib/api'
import { ChartBarSquareIcon } from '@heroicons/react/24/outline'

interface TrainingCasesTableProps {
  cases: TrainingCase[]
}

export function TrainingCasesTable({ cases }: TrainingCasesTableProps) {
  const [validation, setValidation] = useState<ValidationSummary | null>(null)
  const [validating, setValidating] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)

  async function handleRunValidation() {
    setValidating(true)
    setProgress(null)
    try {
      for await (const event of runValidationStream()) {
        if (event.type === 'progress') {
          setProgress({ current: event.current, total: event.total })
        } else if (event.type === 'complete' && event.result) {
          setValidation(event.result as ValidationSummary)
        }
      }
    } finally {
      setValidating(false)
      setProgress(null)
    }
  }

  function getValidationResult(caseId: string) {
    return validation?.results.find(r => r.case_id === caseId)
  }

  function getAuditSignal(tc: TrainingCase): { label: string; className: string; dotClass: string } {
    const notes = (tc.complexity_notes || '').toLowerCase()
    if (notes.includes('contradict') || notes.includes('inconsisten') || notes.includes('false-positive')) {
      return { label: 'Contradiction Risk', className: 'text-amber-700 bg-amber-50', dotClass: 'bg-amber-500' }
    }
    if (tc.expected_outcome === 'LIKELY_DENY') {
      return { label: 'Appeal Candidate', className: 'text-rose-700 bg-rose-50', dotClass: 'bg-rose-500' }
    }
    if (tc.expected_outcome === 'NEED_MORE_INFO') {
      return { label: 'Flip-Likely', className: 'text-orange-700 bg-orange-50', dotClass: 'bg-orange-500' }
    }
    return { label: 'Stable', className: 'text-emerald-700 bg-emerald-50', dotClass: 'bg-emerald-500' }
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <ChartBarSquareIcon className="h-5 w-5 text-[var(--primary)]" />
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            QA Case Dataset
          </h2>
          <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
            {cases.length} cases
          </span>
        </div>
        <button
          onClick={handleRunValidation}
          disabled={validating}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-50 transition-all"
        >
          {validating ? 'Running…' : 'Evaluate Performance'}
        </button>
      </div>

      {/* Progress */}
      {progress && (
        <div className="px-5 py-2.5 bg-[var(--muted)]/30 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
            <span>Processing case {progress.current} of {progress.total}</span>
            <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--primary)] transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Accuracy result */}
      {validation && (
        <div className="px-5 py-2.5 bg-[var(--muted)]/30 border-b border-[var(--border)] space-y-1">
          <div>
            <span className="text-sm font-semibold text-[var(--foreground)]">
              Accuracy: {validation.correct}/{validation.total}
            </span>
            <span className="ml-1.5 text-sm text-[var(--muted-foreground)]">
              ({Math.round(validation.accuracy * 100)}%)
            </span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Tested with expanded summary input (not full clinical packets). Mismatches may reflect input limits, not necessarily a broken pipeline.
          </p>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {cases.map(tc => {
          const vr = getValidationResult(tc.case_id)
          const auditSignal = getAuditSignal(tc)
          return (
            <div
              key={tc.case_id}
              className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-all hover:border-[var(--primary)]/40 hover:shadow-sm"
            >
              {/* Top row */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-[var(--foreground)]">
                  {tc.case_id}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${auditSignal.className}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${auditSignal.dotClass}`} />
                  {auditSignal.label}
                </span>
              </div>

              {/* Service */}
              <p className="text-sm font-medium text-[var(--foreground)] line-clamp-2 leading-snug" title={tc.requested_service}>
                {tc.requested_service}
              </p>

              {/* Complexity notes */}
              {tc.complexity_notes && (
                <p className="mt-1.5 text-xs text-[var(--muted-foreground)] line-clamp-2 leading-relaxed" title={tc.complexity_notes}>
                  {tc.complexity_notes}
                </p>
              )}

              {/* Footer */}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--border)] pt-2.5 text-xs text-[var(--muted-foreground)]">
                <span>
                  Expected:{' '}
                  <span className={`font-semibold ${getRecommendationTextColor(tc.expected_outcome)}`}>
                    {getRecommendationLabel(tc.expected_outcome)}
                  </span>
                </span>
                {vr && (
                  <span className="flex flex-wrap items-center gap-x-2">
                    <span>
                      Actual:{' '}
                      <span className={`font-semibold ${getRecommendationTextColor(vr.actual)}`}>
                        {getRecommendationLabel(vr.actual)}
                      </span>
                      <span className={`ml-1 font-semibold ${vr.match ? 'text-green-600' : 'text-red-600'}`}>
                        {vr.match ? '✓' : '✗'}
                      </span>
                    </span>
                    {!vr.match && (
                      <span className="text-amber-600" title="Benchmark uses expanded summary input">
                        summary mode
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
