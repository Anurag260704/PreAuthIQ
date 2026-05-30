'use client'

import type { ComponentType, ReactNode, SVGProps } from 'react'

export type IntakeAccent =
  | 'emerald'
  | 'teal'
  | 'sky'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'slate'
  | 'lime'

interface IntakeSectionPanelProps {
  index: number
  title: string
  description?: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  accent?: IntakeAccent
  children: ReactNode
}

export function IntakeSectionPanel({
  index,
  title,
  description,
  icon: Icon,
  accent = 'emerald',
  children,
}: IntakeSectionPanelProps) {
  const indexLabel = String(index).padStart(2, '0')

  return (
    <section className={`intake-panel intake-panel-${accent}`}>
      <header className="intake-panel-header">
        <span className="intake-panel-index" aria-hidden>
          {indexLabel}
        </span>
        <span className="intake-panel-icon" aria-hidden>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="intake-panel-title">{title}</h2>
          {description && <p className="intake-panel-desc">{description}</p>}
        </div>
      </header>
      <div className="intake-panel-body">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{children}</div>
      </div>
    </section>
  )
}
