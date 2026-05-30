'use client'

import { useState, useRef } from 'react'
import { reviewCase, uploadAndReview } from '@/lib/api'
import { ApiError } from '@/lib/types'
import type { PreAuthCaseInput, PreAuthSkillOutput } from '@/lib/types'

const LOADING_MESSAGES = [
  { delay: 0, text: 'Extracting clinical fields...' },
  { delay: 2000, text: 'Validating packet completeness...' },
  { delay: 4200, text: 'Adjudicating policy criteria...' },
  { delay: 6500, text: 'Composing final report...' },
]

export function useAnalyze() {
  const [result, setResult]           = useState<PreAuthSkillOutput | null>(null)
  const [isLoading, setIsLoading]     = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState('')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  function clearTimers() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  function startLoadingMessages() {
    LOADING_MESSAGES.forEach(({ delay, text }) => {
      const t = setTimeout(() => setLoadingStep(text), delay)
      timers.current.push(t)
    })
  }

  function persistResult(output: PreAuthSkillOutput) {
    const key = `medclear_report_${output.case_id || 'manual'}_${Date.now()}`
    try {
      sessionStorage.setItem(key, JSON.stringify(output))
      sessionStorage.setItem('medclear_last_key', key)
      const historyRaw = localStorage.getItem('medclear_history')
      const history = historyRaw ? (JSON.parse(historyRaw) as Array<{ key: string; case_id: string; recommendation: string; reviewed_at: string }>) : []
      history.unshift({
        key,
        case_id: output.case_id,
        recommendation: output.recommendation,
        reviewed_at: new Date().toISOString(),
      })
      localStorage.setItem('medclear_history', JSON.stringify(history.slice(0, 20)))
    } catch {
      // sessionStorage not available (e.g. private browsing) — continue anyway
    }
    return output
  }

  async function analyze(input: PreAuthCaseInput): Promise<PreAuthSkillOutput | null> {
    setIsLoading(true)
    setError(null)
    setResult(null)
    startLoadingMessages()

    try {
      const output = await reviewCase(input)
      persistResult(output)
      setResult(output)
      return output
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'An unexpected error occurred. Please try again.'
      setError(msg)
      return null
    } finally {
      clearTimers()
      setIsLoading(false)
      setLoadingStep('')
    }
  }

  async function analyzeFile(file: File): Promise<PreAuthSkillOutput | null> {
    setIsLoading(true)
    setError(null)
    setResult(null)
    startLoadingMessages()

    try {
      const output = await uploadAndReview(file)
      persistResult(output)
      setResult(output)
      return output
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'File upload failed. Please try again.'
      setError(msg)
      return null
    } finally {
      clearTimers()
      setIsLoading(false)
      setLoadingStep('')
    }
  }

  function clearResult() {
    setResult(null)
    setError(null)
  }

  return { analyze, analyzeFile, result, isLoading, error, loadingStep, clearResult }
}

/** Read the most recent result from sessionStorage (for result page) */
export function readStoredResult(): PreAuthSkillOutput | null {
  try {
    const key = sessionStorage.getItem('medclear_last_key')
    if (!key) return null
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as PreAuthSkillOutput
  } catch {
    return null
  }
}

export interface HistoryEntry {
  key: string
  case_id: string
  recommendation: string
  reviewed_at: string
}

export function readReviewHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem('medclear_history')
    if (!raw) return []
    return JSON.parse(raw) as HistoryEntry[]
  } catch {
    return []
  }
}