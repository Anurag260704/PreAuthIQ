'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDownIcon, DocumentTextIcon, ArrowUpTrayIcon, CheckIcon } from '@heroicons/react/24/outline'
import type { TrainingCase, PreAuthCaseInput } from '@/lib/types'
import { RECOMMENDATION_LABEL, RECOMMENDATION_TEXT_COLOR } from '@/lib/utils'
import { buildExpandedClinicalNotes } from '@/lib/trainingNotes'
import { useReview } from '@/hooks/useReview'
import { fetchComplexCaseInput } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorAlert } from '@/components/shared/ErrorAlert'

interface CaseSelectorProps {
  cases: TrainingCase[]
}

export function CaseSelector({ cases }: CaseSelectorProps) {
  const router = useRouter()
  const { analyze, analyzeFile, isLoading, error, loadingStep } = useReview()
  const [selectedId, setSelectedId] = useState<string>('')
  const [preview, setPreview] = useState<TrainingCase | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const COMPLEX_OPTION_ID = 'PA-001-COMPLEX'
  const options = [
    { id: COMPLEX_OPTION_ID, label: 'PA-001 — Complex Case', fullLabel: 'PA-001 — Complex Case (Full 19-Row Packet)' },
    ...cases.map(c => ({
      id: c.case_id,
      label: `${c.case_id} — ${c.requested_service.slice(0, 50)}`,
      fullLabel: `${c.case_id} — ${c.requested_service.slice(0, 50)}`,
    })),
  ]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSelect(id: string) {
    setSelectedId(id)
    setIsOpen(false)
    if (id === COMPLEX_OPTION_ID) {
      const pa001 = cases.find(c => c.case_id === 'PA-001')
      if (pa001) setPreview({ ...pa001, has_full_packet: true })
    } else {
      const found = cases.find(c => c.case_id === id) || null
      setPreview(found)
    }
  }

  async function handleAnalyze() {
    if (!selectedId) return

    let caseData
    if (selectedId === COMPLEX_OPTION_ID) {
      caseData = await fetchComplexCaseInput()
    } else {
      const tc = cases.find(c => c.case_id === selectedId)
      if (!tc) return
      const MAX_RAW_NOTES = 20000
      const rawNotes = buildExpandedClinicalNotes(tc).slice(0, MAX_RAW_NOTES)
      caseData = {
        case_id: tc.case_id,
        requested_service: tc.requested_service,
        primary_diagnosis: tc.clinical_scenario,
        raw_clinical_notes: rawNotes,
      }
    }

    const output = await analyze(caseData)
    if (output) {
      router.push('/report')
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const output = await analyzeFile(file)
    if (output) {
      router.push('/report')
    }
  }

  const selectedOption = options.find(opt => opt.id === selectedId)

  const isFullPacket = selectedId === COMPLEX_OPTION_ID

  if (isLoading) {
    return <LoadingSpinner step={loadingStep} />
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
          Browse PreAuth Cases
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Select a sample case, upload an Excel file, or enter case details manually.
        </p>
      </div>

      {/* Custom Dropdown */}
      <div className="relative mb-3" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--card-foreground)] hover:bg-[var(--muted)] focus:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20 transition-all cursor-pointer"
        >
          <span className={selectedId ? 'text-[var(--card-foreground)]' : 'text-[var(--muted-foreground)]'}>
            {selectedOption ? selectedOption.label : '— Select a case —'}
          </span>
          <ChevronDownIcon className={`h-4 w-4 text-[var(--muted-foreground)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg z-50">
            {options.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt.id)}
                className="w-full px-3 py-2.5 text-left text-sm text-[var(--card-foreground)] hover:bg-[var(--muted)] transition-colors flex items-center justify-between gap-2"
                title={opt.fullLabel}
              >
                <span className="truncate">{opt.label}</span>
                {selectedId === opt.id && <CheckIcon className="h-3.5 w-3.5 text-[var(--primary)] flex-shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="mb-4 rounded-xl bg-[var(--muted)]/50 p-4 border border-[var(--border)]">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest mb-1.5">
            Clinical Scenario
          </p>
          <p className="text-sm text-[var(--card-foreground)] mb-3 line-clamp-3 leading-relaxed">
            {preview.clinical_scenario}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${RECOMMENDATION_TEXT_COLOR[preview.expected_outcome]} border-current`}>
              Expected: {RECOMMENDATION_LABEL[preview.expected_outcome]}
            </span>
            {preview.has_full_packet ? (
              <span className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] px-2.5 py-0.5 rounded-full font-semibold">
                Full Packet
              </span>
            ) : (
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-semibold">
                Expanded Summary Mode
              </span>
            )}
          </div>
          {!preview.has_full_packet && (
            <p className="mt-2 text-xs text-amber-700 leading-relaxed">
              Expected outcome assumes full documentation. Expanded summary mode may produce a different verdict than the benchmark label.
            </p>
          )}
          {preview.complexity_notes && (
            <p className="mt-2 text-xs text-[var(--muted-foreground)] italic line-clamp-2">
              {preview.complexity_notes}
            </p>
          )}
        </div>
      )}

      {error && <div className="mb-3"><ErrorAlert message={error} /></div>}

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleAnalyze}
          disabled={!selectedId || isLoading}
          className="w-full premium-button-primary py-2.5 text-sm whitespace-nowrap"
        >
          {isFullPacket ? 'Review Full Packet' : 'Review Expanded Summary'}
        </button>

        <label className="w-full cursor-pointer rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-all text-center flex items-center justify-center gap-1.5 whitespace-nowrap">
          <ArrowUpTrayIcon className="h-4 w-4" />
          Import Excel File
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        <a
          href="/review"
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-all text-center flex items-center justify-center gap-1.5 whitespace-nowrap"
        >
          <DocumentTextIcon className="h-4 w-4" />
          Add Case Manually
        </a>
      </div>
    </div>
  )
}
