import { formatMs } from '@/lib/utils'

interface ProcessingMetaFooterProps {
  totalMs: number
  step1Ms: number
  step2Ms: number
}

export function ProcessingMetaFooter({
  totalMs,
  step1Ms,
  step2Ms,
}: ProcessingMetaFooterProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-4 text-xs text-[var(--muted-foreground)]">
      <span>
        Total <span className="font-medium text-[var(--foreground)]">{formatMs(totalMs)}</span>
      </span>
      <span className="text-[var(--border)]">·</span>
      <span>
        Normalize <span className="font-medium text-[var(--foreground)]">{formatMs(step1Ms)}</span>
      </span>
      <span className="text-[var(--border)]">·</span>
      <span>
        Evaluate <span className="font-medium text-[var(--foreground)]">{formatMs(step2Ms)}</span>
      </span>
    </div>
  )
}
