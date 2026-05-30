'use client'

import { useEffect, useState } from 'react'
import { fetchTrainingCases } from '@/lib/api'
import type { TrainingCase } from '@/lib/types'
import { CaseSelector } from '@/components/home/CaseSelector'
import { TrainingCasesTable } from '@/components/home/TrainingCasesTable'
import Link from 'next/link'
import {
  ExclamationTriangleIcon,
  DocumentPlusIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const [cases, setCases] = useState<TrainingCase[]>([])

  useEffect(() => {
    fetchTrainingCases()
      .then(setCases)
      .catch(() => {})
  }, [])

  const contradictoryCases = cases.filter((item) => {
    const notes = (item.complexity_notes || '').toLowerCase()
    return notes.includes('contradict') || notes.includes('inconsisten') || notes.includes('false-positive')
  })
  const flipLikelyCases = cases.filter((item) => item.expected_outcome === 'NEED_MORE_INFO')
  const highRiskDenials = cases.filter((item) => item.expected_outcome === 'LIKELY_DENY')
  const strongApprovals = cases.filter((item) => item.expected_outcome === 'LIKELY_APPROVE')

  const stats = [
    {
      label: 'Contradiction Queue',
      value: contradictoryCases.length,
      description: 'Cases with conflicting chart signals.',
      icon: ExclamationTriangleIcon,
    },
    {
      label: 'Appeal Candidates',
      value: highRiskDenials.length,
      description: 'Cases likely needing rebuttal packets.',
      icon: DocumentPlusIcon,
    },
    {
      label: 'Flip-Likely Cases',
      value: flipLikelyCases.length,
      description: 'More-info decisions with upside after documentation.',
      icon: ArrowPathIcon,
    },
    {
      label: 'Stable Approvals',
      value: strongApprovals.length,
      description: 'High-confidence approval benchmark cases.',
      icon: CheckBadgeIcon,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl">
          PreAuth IQ Dashboard
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Review clinical cases, track QA signals, and generate prior authorization decisions.
        </p>
      </div>

      {/* Stat strip */}
      <div className="mx-auto w-full max-w-5xl grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(({ label, value, description, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest leading-tight">
                {label}
              </p>
              <Icon className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
            </div>
            <p className="text-3xl font-bold text-[var(--foreground)]">{value}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)] leading-snug">{description}</p>
          </div>
        ))}
      </div>

      {/* Case selector */}
      <div id="reviewer-workspace" className="mx-auto w-full max-w-4xl scroll-mt-24">
        <CaseSelector cases={cases} />
      </div>

      {/* Help banner */}
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <BookOpenIcon className="h-5 w-5 shrink-0 text-[var(--primary)] mt-0.5" />
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Need Help Using PreAuth IQ?</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Open the user guide for step-by-step workflow instructions.
            </p>
          </div>
        </div>
        <Link href="/user-guide" className="premium-button-primary text-sm whitespace-nowrap">
          Open User Guide
        </Link>
      </div>

      {/* QA dataset table */}
      <div id="audit-console" className="mx-auto w-full max-w-5xl scroll-mt-24">
        <TrainingCasesTable cases={cases} />
      </div>
    </div>
  )
}
