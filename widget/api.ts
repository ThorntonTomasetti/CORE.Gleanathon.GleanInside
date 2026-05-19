import type { ChatRequest, ChatResponse } from './types'

export async function postChat (apiUrl: string, body: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`chat request failed (${res.status}): ${text || res.statusText}`)
  }
  return res.json() as Promise<ChatResponse>
}
