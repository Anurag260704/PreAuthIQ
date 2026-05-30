'use client'

import { InformationCircleIcon } from '@heroicons/react/24/outline'

interface FieldTooltipProps {
  text: string
}

export function FieldTooltip({ text }: FieldTooltipProps) {
  return (
    <div className="group relative inline-block ml-1">
      <InformationCircleIcon className="h-3 w-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-help" />
      <div className="invisible group-hover:visible absolute z-10 left-4 top-0 w-60 rounded-md bg-[var(--foreground)] px-2.5 py-1.5 text-xs text-[var(--background)] shadow-md">
        {text}
        <div className="absolute left-0 top-1.5 -translate-x-1 border-4 border-transparent border-r-[var(--foreground)]" />
      </div>
    </div>
  )
}