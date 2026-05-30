import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRightIcon,
  CheckBadgeIcon,
  ChartBarSquareIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

export default function LandingPage() {
  return (
    <div className="mx-[calc(50%-50vw)] w-screen space-y-8 px-4 sm:px-6 lg:px-8 xl:px-10">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-white text-slate-900 shadow-xl min-h-[calc(100vh-3rem)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.12),transparent_45%),radial-gradient(circle_at_85%_15%,rgba(132,204,22,0.12),transparent_40%)]" />
        <div className="relative grid min-h-[calc(100vh-3rem)] items-center gap-10 px-6 py-10 md:px-10 md:py-14 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="max-w-4xl space-y-7">
            <div className="flex items-center gap-4">
              <Image
                src="/preauthiq-logo.svg"
                alt="PreAuthIQ"
                width={170}
                height={44}
                className="h-12 w-auto"
                priority
              />
              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
                Introducing PreAuthIQ Platform
              </span>
            </div>
            <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              Beautiful, Explainable
              <span className="block bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
                Clinical Adjudication
              </span>
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-slate-600 sm:text-2xl">
              Operate in two distinct modes: a reviewer-facing decision workspace and a QA audit console for consistency, contradiction, and appeal readiness tracking.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-lime-400 px-7 py-3 text-base font-semibold text-[#05210f] shadow-lg shadow-emerald-500/25">
                Enter Dashboard
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <Link href="/review" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-7 py-3 text-base font-semibold text-slate-800 hover:bg-slate-100">
                Case Decision Mode
              </Link>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-emerald-400/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-emerald-200 bg-white p-3 shadow-2xl shadow-emerald-200/50">
              <Image
                src="/preauthiq-hero-visual.png"
                alt="AI powered prior authorization analytics workstation"
                width={1024}
                height={640}
                className="h-auto w-full rounded-[1.5rem] object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="premium-card">
          <ClipboardDocumentListIcon className="h-7 w-7 text-[var(--primary)]" />
          <h2 className="mt-2 text-lg font-semibold text-[var(--foreground)]">Reviewer Workspace</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Run individual case decisions, inspect criteria evidence, and generate final recommendation reports for utilization review.
          </p>
          <Link href="/dashboard#reviewer-workspace" className="mt-3 inline-flex items-center text-sm font-medium text-[var(--primary)]">
            Open reviewer view
          </Link>
        </div>
        <div className="premium-card">
          <ChartBarSquareIcon className="h-7 w-7 text-[var(--accent)]" />
          <h2 className="mt-2 text-lg font-semibold text-[var(--foreground)]">QA & Audit Console</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Monitor contradiction risk, consistency scores, appeal readiness, and benchmark drift across training and live cases.
          </p>
          <Link href="/dashboard#audit-console" className="mt-3 inline-flex items-center text-sm font-medium text-[var(--primary)]">
            Open QA console
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="premium-card border-cyan-400/30 bg-[linear-gradient(180deg,rgba(6,182,212,0.15),rgba(15,23,42,0.04))]">
          <DocumentMagnifyingGlassIcon className="h-7 w-7 text-cyan-400" />
          <h2 className="mt-3 text-lg font-semibold text-[var(--foreground)]">Clinical Precision</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Rich packet parsing plus evidence-aware reasoning keeps decisions anchored to charted facts.
          </p>
        </div>
        <div className="premium-card border-indigo-400/30 bg-[linear-gradient(180deg,rgba(99,102,241,0.18),rgba(15,23,42,0.04))]">
          <ChartBarSquareIcon className="h-7 w-7 text-indigo-400" />
          <h2 className="mt-3 text-lg font-semibold text-[var(--foreground)]">Scale & Speed</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Process high-volume reviews with consistent rule application across services and care sites.
          </p>
        </div>
        <div className="premium-card border-emerald-400/30 bg-[linear-gradient(180deg,rgba(16,185,129,0.15),rgba(15,23,42,0.04))]">
          <ShieldCheckIcon className="h-7 w-7 text-emerald-400" />
          <h2 className="mt-3 text-lg font-semibold text-[var(--foreground)]">Audit Ready</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Every recommendation includes criteria evidence, documentation gaps, and transparent confidence.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/80 p-6 shadow-lg">
        <div className="mb-5 text-center">
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">The PreAuthIQ Process</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            A clean four-step flow from intake to reviewer-ready report.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            { step: '01', title: 'Extract', text: 'Structure raw records and packet data into normalized clinical fields.' },
            { step: '02', title: 'Validate', text: 'Score completeness, flag required-field issues, and surface enrichment hints.' },
            { step: '03', title: 'Adjudicate', text: 'Apply policy criteria with evidence and contradiction-aware logic.' },
            { step: '04', title: 'Compose', text: 'Generate clear reviewer summary with recommendation and action path.' },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-4">
              <p className="text-xs font-semibold text-[var(--primary)]">{item.step}</p>
              <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-[var(--border)] bg-[var(--card)]/85 p-6 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">Core Engine</p>
          <h2 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Multi-Policy Clinical Reasoning</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            PreAuthIQ combines deterministic validation and LLM adjudication so teams can move faster without sacrificing traceability.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--foreground)]">
            <li className="flex items-center gap-2"><CheckBadgeIcon className="h-5 w-5 text-emerald-500" /> Policy-to-evidence alignment</li>
            <li className="flex items-center gap-2"><CheckBadgeIcon className="h-5 w-5 text-emerald-500" /> Source-aware contradiction handling</li>
            <li className="flex items-center gap-2"><CheckBadgeIcon className="h-5 w-5 text-emerald-500" /> Report-ready review narrative</li>
          </ul>
        </div>
        <div className="space-y-4">
          <div className="premium-card">
            <ClipboardDocumentCheckIcon className="h-6 w-6 text-[var(--accent)]" />
            <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">Validation Insights</h3>
            <p className="text-xs text-[var(--muted-foreground)]">See quality score, missing required fields, and enrichment hints before final recommendation.</p>
          </div>
          <div className="premium-card">
            <ShieldCheckIcon className="h-6 w-6 text-[var(--primary)]" />
            <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">Clinical Reliability</h3>
            <p className="text-xs text-[var(--muted-foreground)]">Evidence citations and model metadata stay attached to each generated report.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[linear-gradient(90deg,rgba(99,102,241,0.12),rgba(6,182,212,0.1))] p-8 text-center">
        <h2 className="text-3xl font-semibold text-[var(--foreground)]">Ready to modernize your review workflow?</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">
          Open the dashboard for sample-driven testing, or jump directly into manual and workbook-based case review.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="premium-button-primary px-5 py-2.5">
            Open Dashboard
          </Link>
          <Link href="/review" className="premium-button-secondary px-5 py-2.5">
            Review Form
          </Link>
        </div>
      </section>
    </div>
  )
}
