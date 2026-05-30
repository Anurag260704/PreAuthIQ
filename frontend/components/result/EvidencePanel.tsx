import type { EvidenceSnippet } from '@/lib/types'
import { getSourceColor } from '@/lib/utils'
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

interface EvidencePanelProps {
  evidence: EvidenceSnippet[]
}

export function EvidencePanel({ evidence }: EvidencePanelProps) {
  if (evidence.length === 0) return null

  return (
    <div className="report-section">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardDocumentListIcon className="h-5 w-5 text-[var(--primary)]" />
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">
          Cited Clinical Evidence
        </h3>
        <span className="ml-auto rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted-foreground)]">
          {evidence.length} {evidence.length === 1 ? 'source' : 'sources'}
        </span>
      </div>

      <div>
        {evidence.map((e, i) => (
          <div
            key={`${e.source}-${i}`}
            className="flex items-start gap-3 border-t border-[var(--border)] py-3 first:border-t-0 first:pt-0"
          >
            <span className={`mt-0.5 shrink-0 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getSourceColor(e.source)}`}>
              {e.source}
            </span>
            <p className="text-sm leading-relaxed text-[var(--foreground)]">{e.excerpt}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
