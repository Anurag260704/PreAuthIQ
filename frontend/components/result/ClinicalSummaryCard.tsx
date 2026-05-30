import { DocumentTextIcon } from '@heroicons/react/24/outline'

interface ClinicalSummaryCardProps {
  summary: string
}

export function ClinicalSummaryCard({ summary }: ClinicalSummaryCardProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <DocumentTextIcon className="h-5 w-5 text-[var(--primary)]" />
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">
          Clinical Summary
        </h3>
      </div>
      <p className="text-base text-[var(--foreground)] leading-relaxed">{summary}</p>
    </div>
  )
}
