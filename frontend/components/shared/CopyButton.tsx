'use client'

import { useState } from 'react'
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'

interface CopyButtonProps {
  text: string
  label?: string
}

export function CopyButton({ text, label = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
    >
      {copied ? (
        <>
          <CheckIcon className="h-3 w-3 text-green-600" />
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          <ClipboardDocumentIcon className="h-3 w-3" />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}