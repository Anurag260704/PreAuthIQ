import { CopyButton } from '@/components/shared/CopyButton'
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline'

interface ProviderQueryBoxProps {
  query: string
}

export function ProviderQueryBox({ query }: ProviderQueryBoxProps) {
  if (!query) return null

  return (
    <div className="report-section">
      <div className="flex items-center gap-2 mb-3">
        <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-[var(--accent)]" />
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">
          Provider Outreach Draft
        </h3>
        <div className="ml-auto">
          <CopyButton text={query} label="Copy" />
        </div>
      </div>
      <blockquote className="border-l-4 border-[var(--accent)] pl-4 text-sm leading-relaxed text-[var(--foreground)] whitespace-pre-wrap">
        {query}
      </blockquote>
    </div>
  )
}
