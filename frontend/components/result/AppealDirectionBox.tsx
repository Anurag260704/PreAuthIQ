import { CopyButton } from '@/components/shared/CopyButton'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface AppealDirectionBoxProps {
  direction: string
}

export function AppealDirectionBox({ direction }: AppealDirectionBoxProps) {
  return (
    <div className="report-section">
      <div className="flex items-center gap-2 mb-3">
        <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">
          Appeal Direction
        </h3>
        <div className="ml-auto">
          <CopyButton text={direction} label="Copy" />
        </div>
      </div>
      <p className="text-sm leading-relaxed text-red-700 whitespace-pre-wrap">{direction}</p>
    </div>
  )
}
