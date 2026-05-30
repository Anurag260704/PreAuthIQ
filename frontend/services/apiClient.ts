import type {
  TrainingCase,
  PreAuthCaseInput,
  PreAuthSkillOutput,
  AppealDraftResponse,
  SchemaField,
  ValidationSummary,
  ValidationProgressEvent,
} from '@/lib/types'
import { ApiError } from '@/lib/types'

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
const API_PREFIX = '/api/v1'

export { BASE }

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  const method = (init?.method || 'GET').toUpperCase()
  const shouldSetContentType = method !== 'GET' && method !== 'HEAD'

  try {
    const baseHeaders: Record<string, string> = shouldSetContentType
      ? { 'Content-Type': 'application/json' }
      : {}
    if (process.env.NEXT_PUBLIC_API_KEY) {
      baseHeaders['Authorization'] = `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
    }

    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { ...baseHeaders, ...(init?.headers as Record<string, string> | undefined) },
    })
  } catch {
    throw new ApiError(0, 'Unable to connect to PreAuthIQ API service.')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message =
      body?.detail?.message ||
      (typeof body?.detail === 'string' ? body.detail : null) ||
      `Request failed with status ${res.status}`
    throw new ApiError(res.status, message, body)
  }

  return res.json() as Promise<T>
}

export async function fetchTrainingCases(): Promise<TrainingCase[]> {
  return apiFetch<TrainingCase[]>(`${API_PREFIX}/samples`)
}

export async function fetchHealth(): Promise<{ status: string; model: string }> {
  return apiFetch<{ status: string; model: string }>(`${API_PREFIX}/status`)
}

export async function fetchCaseById(id: string): Promise<TrainingCase> {
  return apiFetch<TrainingCase>(`${API_PREFIX}/samples/${id}`)
}

export async function fetchInputSchema(): Promise<SchemaField[]> {
  return apiFetch<SchemaField[]>(`${API_PREFIX}/fields`)
}

export async function reviewCase(input: PreAuthCaseInput): Promise<PreAuthSkillOutput> {
  return apiFetch<PreAuthSkillOutput>(`${API_PREFIX}/review`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function uploadAndReview(file: File): Promise<PreAuthSkillOutput> {
  let res: Response
  const formData = new FormData()
  formData.append('file', file)
  try {
    const headers: Record<string, string> = {}
    if (process.env.NEXT_PUBLIC_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
    }
    res = await fetch(`${BASE}${API_PREFIX}/review/upload`, {
      method: 'POST',
      body: formData,
      headers,
    })
  } catch {
    throw new ApiError(0, 'Unable to connect to PreAuthIQ API service.')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message =
      body?.detail?.message ||
      (typeof body?.detail === 'string' ? body.detail : null) ||
      `Upload failed with status ${res.status}`
    throw new ApiError(res.status, message, body)
  }
  return res.json() as Promise<PreAuthSkillOutput>
}

export async function fetchComplexCaseInput(): Promise<PreAuthCaseInput> {
  return apiFetch<PreAuthCaseInput>(`${API_PREFIX}/samples/complex`)
}

export async function generateAppealDraft(
  report: PreAuthSkillOutput
): Promise<AppealDraftResponse> {
  return apiFetch<AppealDraftResponse>(`${API_PREFIX}/review/appeal`, {
    method: 'POST',
    body: JSON.stringify(report),
  })
}

export async function runValidation(): Promise<ValidationSummary> {
  return apiFetch<ValidationSummary>(`${API_PREFIX}/benchmark`)
}

export async function* runValidationStream(): AsyncIterable<ValidationProgressEvent> {
  const headers: Record<string, string> = {}
  if (process.env.NEXT_PUBLIC_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
  }
  const response = await fetch(`${BASE}${API_PREFIX}/benchmark/stream`, { headers })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const message =
      body?.detail?.message ||
      (typeof body?.detail === 'string' ? body.detail : null) ||
      `Request failed with status ${response.status}`
    throw new ApiError(response.status, message, body)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new ApiError(0, 'No response body from benchmark stream')
  }
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''
      for (const event of events) {
        for (const line of event.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (!data) continue
          try {
            yield JSON.parse(data) as ValidationProgressEvent
          } catch {
            // Skip malformed JSON fragments.
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
