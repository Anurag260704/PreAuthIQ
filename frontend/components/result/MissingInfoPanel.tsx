import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface MissingInfoPanelProps {
  items: string[]
}

export function MissingInfoPanel({ items }: MissingInfoPanelProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2.5">
        <CheckCircleIcon className="h-5 w-5 shrink-0 text-green-500" />
        <p className="text-sm font-medium text-green-700">
          Documentation complete — nothing outstanding
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">
          Records to Close Out
        </h3>
        <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
          {items.length} open
        </span>
      </div>

      <ol className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800 tabular-nums">
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed text-[var(--foreground)]">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
