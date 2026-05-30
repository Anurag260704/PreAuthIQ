'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useReview, readStoredResult, readReviewHistory, type HistoryEntry } from '@/hooks/useReview'
import type { AppealDraftResponse, PreAuthSkillOutput } from '@/lib/types'
import { RecommendationBanner } from '@/components/result/RecommendationBanner'
import { ClinicalSummaryCard } from '@/components/result/ClinicalSummaryCard'
import { CriteriaTable } from '@/components/result/CriteriaTable'
import { EvidencePanel } from '@/components/result/EvidencePanel'
import { MissingInfoPanel } from '@/components/result/MissingInfoPanel'
import { ProviderQueryBox } from '@/components/result/ProviderQueryBox'
import { FlipConditionBox } from '@/components/result/FlipConditionBox'
import { AppealDirectionBox } from '@/components/result/AppealDirectionBox'
import { ProcessingMetaFooter } from '@/components/result/ProcessingMetaFooter'
import { CopyButton } from '@/components/shared/CopyButton'
import { exportJson, buildMarkdownReport, exportReportPdf, exportMarkdownFile } from '@/lib/utils'
import { generateAppealDraft } from '@/lib/api'
import {
  DocumentArrowDownIcon,
  CodeBracketSquareIcon,
  DocumentPlusIcon,
  ArrowLeftIcon,
  ChartBarSquareIcon,
  ShieldCheckIcon,
  BoltIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

export default function ResultPage() {
  const router = useRouter()
  const { result, clearResult } = useReview()
  const [pageResult, setPageResult] = useState<PreAuthSkillOutput | null>(result)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [appealDraft, setAppealDraft] = useState<AppealDraftResponse | null>(null)
  const [appealError, setAppealError] = useState<string | null>(null)
  const [appealLoading, setAppealLoading] = useState(false)

  useEffect(() => {
    if (!result) {
      const stored = readStoredResult()
      if (stored) {
        setPageResult(stored)
      } else {
        router.push('/review')
      }
    }
    setHistory(readReviewHistory())
  }, [result, router])

  if (!pageResult) return null

  const r = pageResult
  const hasAuditScores =
    r.consistency_score != null ||
    r.contradiction_risk_index != null ||
    r.appeal_readiness_score != null

  function handleExportJson() {
    exportJson(r, `preauthiq-report-${r.case_id}.json`)
  }

  function handleExportPdf() {
    exportReportPdf(r)
  }

  function handleExportMarkdown() {
    exportMarkdownFile(r, `preauthiq-report-${r.case_id}.md`)
  }

  function handleNewCase() {
    clearResult()
    router.push('/review')
  }

  async function handleGenerateAppeal() {
    setAppealLoading(true)
    setAppealError(null)
    try {
      const draft = await generateAppealDraft(r)
      setAppealDraft(draft)
    } catch (error) {
      setAppealError(error instanceof Error ? error.message : 'Failed to generate appeal draft.')
    } finally {
      setAppealLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ─── 1. VERDICT HERO ──────────────────────────────────────── */}
      <div>
        <RecommendationBanner output={r} />

        {/* Action bar below hero */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CopyButton text={buildMarkdownReport(r)} label="Copy Report" />
          <button onClick={handleExportPdf} className="inline-flex items-center gap-1.5 premium-button-secondary text-xs px-3 py-1.5">
            <DocumentArrowDownIcon className="h-3.5 w-3.5" />
            Export PDF
          </button>
          <button onClick={handleExportMarkdown} className="inline-flex items-center gap-1.5 premium-button-secondary text-xs px-3 py-1.5">
            <DocumentArrowDownIcon className="h-3.5 w-3.5" />
            Download Markdown
          </button>
          <button onClick={handleExportJson} className="inline-flex items-center gap-1.5 premium-button-secondary text-xs px-3 py-1.5">
            <CodeBracketSquareIcon className="h-3.5 w-3.5" />
            Export JSON
          </button>
          <button
            onClick={handleGenerateAppeal}
            disabled={appealLoading}
            className="inline-flex items-center gap-1.5 premium-button-secondary text-xs px-3 py-1.5"
          >
            <DocumentPlusIcon className="h-3.5 w-3.5" />
            {appealLoading ? 'Generating…' : 'Appeal Packet'}
          </button>
          <button onClick={handleNewCase} className="inline-flex items-center gap-1.5 premium-button-primary text-xs px-3 py-1.5 ml-auto">
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            New Case
          </button>
        </div>
      </div>

      {/* ─── 2. MAIN CONTENT ─────────────────────────────────────── */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/80 p-6 shadow-sm">

        {/* Clinical Summary */}
        <ClinicalSummaryCard summary={r.clinical_summary} />

        {/* Criteria Timeline */}
        <CriteriaTable criteria={r.criteria_results} />

        {/* Supporting Evidence */}
        <EvidencePanel evidence={r.supporting_evidence} />

        {/* Validation Insights */}
        {r.validation_insights && (
          <div className="report-section">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheckIcon className="h-5 w-5 text-[var(--primary)]" />
              <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">
                Data Quality
              </h3>
              <span className="ml-auto text-base font-bold text-[var(--foreground)]">
                {Math.round(r.validation_insights.quality_score * 100)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--muted)] overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all"
                style={{ width: `${Math.round(r.validation_insights.quality_score * 100)}%` }}
              />
            </div>
            {r.validation_insights.required_field_issues.length > 0 && (
              <ul className="space-y-1 mb-3">
                {r.validation_insights.required_field_issues.map(issue => (
                  <li key={issue} className="flex items-start gap-2 text-sm text-rose-600">
                    <span className="mt-0.5 shrink-0">✕</span>{issue}
                  </li>
                ))}
              </ul>
            )}
            {r.validation_insights.enrichment_hints.length > 0 && (
              <ul className="space-y-1">
                {r.validation_insights.enrichment_hints.map(hint => (
                  <li key={hint} className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]">
                    <span className="mt-0.5 shrink-0 text-[var(--primary)]">→</span>{hint}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Missing info */}
        <div className="report-section">
          <MissingInfoPanel items={r.missing_information} />
        </div>

        {/* Provider query */}
        <ProviderQueryBox query={r.provider_query} />

        {/* Flip condition + appeal direction */}
        {r.flip_condition && <FlipConditionBox condition={r.flip_condition} />}
        {r.appeal_direction && <AppealDirectionBox direction={r.appeal_direction} />}
      </div>

      {/* ─── 3. QA AUDIT STRIP ───────────────────────────────────── */}
      {hasAuditScores && (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/80 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <ChartBarSquareIcon className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">
              QA Audit Scores
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                label: 'Consistency Score',
                value: r.consistency_score,
                icon: ShieldCheckIcon,
                color: 'text-blue-600',
                bar: 'bg-blue-500',
              },
              {
                label: 'Contradiction Risk',
                value: r.contradiction_risk_index,
                icon: BoltIcon,
                color: 'text-amber-600',
                bar: 'bg-amber-500',
              },
              {
                label: 'Appeal Readiness',
                value: r.appeal_readiness_score,
                icon: DocumentTextIcon,
                color: 'text-purple-600',
                bar: 'bg-purple-500',
              },
            ].map(({ label, value, icon: Icon, color, bar }) =>
              value != null ? (
                <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-4">
                  <Icon className={`h-5 w-5 ${color} mb-2`} />
                  <p className="text-xs text-[var(--muted-foreground)] mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{Math.round(value * 100)}%</p>
                  <div className="mt-2 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                    <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.round(value * 100)}%` }} />
                  </div>
                </div>
              ) : null
            )}
          </div>
          {r.audit_flags && r.audit_flags.length > 0 && (
            <ul className="mt-4 space-y-1.5 border-t border-[var(--border)] pt-4">
              {r.audit_flags.map(flag => (
                <li key={flag} className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]">
                  <span className="mt-0.5 shrink-0 text-amber-500">⚑</span>
                  {flag}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ─── 4. APPEAL DRAFT ─────────────────────────────────────── */}
      {appealError && (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
          <p className="text-sm font-semibold text-rose-700 mb-1">Appeal Draft Error</p>
          <p className="text-sm text-rose-600">{appealError}</p>
        </section>
      )}

      {appealDraft && (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/80 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <DocumentPlusIcon className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">
              Appeal Packet Draft
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-widest mb-2">
                Medical Necessity Summary
              </p>
              <p className="text-sm text-[var(--foreground)] leading-relaxed">
                {appealDraft.summary_of_medical_necessity}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-widest mb-2">
                Criterion-wise Rebuttals
              </p>
              <ul className="space-y-1.5">
                {appealDraft.criterion_rebuttals.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                    <span className="mt-0.5 shrink-0 text-[var(--primary)]">·</span>{item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-widest mb-2">
                Missing Evidence Checklist
              </p>
              <ul className="space-y-1.5">
                {appealDraft.missing_evidence_checklist.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                    <span className="mt-0.5 shrink-0 h-4 w-4 rounded border border-[var(--border)] bg-[var(--muted)] inline-block" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-widest mb-2">
                Reconsideration Text
              </p>
              <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap bg-[var(--muted)]/40 rounded-xl p-3">
                {appealDraft.requested_reconsideration_text}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ─── 5. FOOTER: timing + history ─────────────────────────── */}
      <ProcessingMetaFooter
        totalMs={r.processing_time_ms}
        step1Ms={r.step1_time_ms}
        step2Ms={r.step2_time_ms}
      />

      {history.length > 0 && (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/80 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ClockIcon className="h-5 w-5 text-[var(--muted-foreground)]" />
            <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">
              Recent Reviews
            </h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {history.slice(0, 5).map(item => (
              <div key={item.key} className="flex items-center gap-3 py-2.5">
                <span className="text-sm font-medium text-[var(--foreground)]">{item.case_id}</span>
                <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                  {item.recommendation}
                </span>
                <span className="ml-auto text-xs text-[var(--muted-foreground)] tabular-nums">
                  {new Date(item.reviewed_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
