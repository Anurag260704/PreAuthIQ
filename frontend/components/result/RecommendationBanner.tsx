import type { PreAuthSkillOutput } from '@/lib/types'
import {
  RECOMMENDATION_GRADIENT,
  RECOMMENDATION_LABEL,
  CONFIDENCE_BADGE,
} from '@/lib/utils'
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline'

const RECOMMENDATION_ICON = {
  LIKELY_APPROVE: CheckCircleIcon,
  NEED_MORE_INFO: ClockIcon,
  LIKELY_DENY:    XCircleIcon,
}

interface RecommendationBannerProps {
  output: PreAuthSkillOutput
}

export function RecommendationBanner({ output }: RecommendationBannerProps) {
  const gradient = RECOMMENDATION_GRADIENT[output.recommendation]
  const Icon = RECOMMENDATION_ICON[output.recommendation]

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 md:p-8 shadow-xl`}>
      {/* Decorative radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.12),transparent_60%)]" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: verdict */}
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
              Authorization Decision
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              {RECOMMENDATION_LABEL[output.recommendation]}
            </h2>
            <p className="mt-1.5 text-white/75 text-sm">
              {output.case_id}
              {output.requested_service && (
                <> &nbsp;·&nbsp; {output.requested_service}</>
              )}
            </p>
          </div>
        </div>

        {/* Right: confidence */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${CONFIDENCE_BADGE[output.confidence]}`}>
            {output.confidence} Confidence
          </span>
        </div>
      </div>
    </div>
  )
}
