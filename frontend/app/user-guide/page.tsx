import Link from 'next/link'

export default function UserGuidePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="premium-card">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">PreAuth IQ User Guide</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Follow this quick guide to run case reviews, interpret outputs, and export reviewer-ready reports.
        </p>
      </div>

      <div className="premium-card">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">How To Use</h2>
        <ol className="mt-3 space-y-3 text-sm text-[var(--muted-foreground)]">
          <li>
            <span className="font-semibold text-[var(--foreground)]">1. Choose Input Mode:</span>{' '}
            Use the dashboard selector to pick a sample case, upload an Excel workbook, or switch to manual entry.
          </li>
          <li>
            <span className="font-semibold text-[var(--foreground)]">2. Run Case Decision:</span>{' '}
            Click <strong>Analyze This Case</strong> to start extract, validate, adjudicate, and compose flow.
          </li>
          <li>
            <span className="font-semibold text-[var(--foreground)]">3. Review Report:</span>{' '}
            Open the report page to inspect recommendation, criteria status, evidence snippets, missing information, and provider query.
          </li>
          <li>
            <span className="font-semibold text-[var(--foreground)]">4. Check QA Signals:</span>{' '}
            On dashboard QA section, review contradiction queue, appeal candidates, and flip-likely case buckets.
          </li>
          <li>
            <span className="font-semibold text-[var(--foreground)]">5. Generate Appeal Packet:</span>{' '}
            From report page, click <strong>Generate Appeal Packet</strong> to create criterion rebuttals and checklist text.
          </li>
          <li>
            <span className="font-semibold text-[var(--foreground)]">6. Export & Share:</span>{' '}
            Export PDF/JSON for documentation, submission, or internal review.
          </li>
        </ol>
      </div>

      <div className="premium-card">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Best Practices</h2>
        <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-[var(--muted-foreground)]">
          <li>Include source-backed findings (specialist note, imaging, lab, procedure note).</li>
          <li>Capture clear conservative-treatment timeline and treatment response.</li>
          <li>Document contradictions explicitly when notes conflict across visits.</li>
          <li>Use missing-information items as a direct checklist for resubmission.</li>
        </ul>
      </div>

      <div className="flex justify-end">
        <Link href="/dashboard" className="premium-button-secondary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
