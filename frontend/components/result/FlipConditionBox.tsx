import { ArrowPathIcon } from '@heroicons/react/24/outline'

interface FlipConditionBoxProps {
  condition: string
}

export function FlipConditionBox({ condition }: FlipConditionBoxProps) {
  return (
    <div className="report-section">
      <div className="flex items-center gap-2 mb-3">
        <ArrowPathIcon className="h-5 w-5 text-teal-500" />
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">
          What Would Flip This?
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-teal-700">{condition}</p>
    </div>
  )
}
