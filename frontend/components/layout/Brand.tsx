import Image from 'next/image'

interface BrandProps {
  compact?: boolean
}

export function Brand({ compact = false }: BrandProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <Image
        src="/preauthiq-logo.svg"
        alt="PreAuthIQ logo"
        width={compact ? 132 : 164}
        height={compact ? 34 : 42}
        className={compact ? 'h-10 w-auto sm:h-11' : 'h-12 w-auto sm:h-14'}
        priority={compact}
      />
    </span>
  )
}
