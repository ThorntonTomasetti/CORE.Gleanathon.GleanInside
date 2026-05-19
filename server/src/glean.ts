import type { GleanScopeFilters } from './appScopes.js'

export interface Citation {
  title: string
  url?: string
  snippet?: string
}

export interface GleanChatResult {
  answer: string
  citations: Citation[]
  conversationId?: string
}

interface GleanChatArgs {
  message: string
  conversationId?: string
  filters: GleanScopeFilters
}

/**
 * Calls Glean's Chat API. Shape follows the public Client API spec:
 * https://developers.glean.com/api-reference/client-api/chat/chat
 *
 * If your tenant uses a different schema (some enterprise tenants do),
 * adjust the request/response mapping below — the surrounding code does
 * not need to change.
 */
export async function gleanChat (args: GleanChatArgs): Promise<GleanChatResult> {
  const base = process.env.GLEAN_BASE_URL
  const key = process.env.GLEAN_API_KEY
  if (!base || !key) {
    throw new Error('GLEAN_BASE_URL and GLEAN_API_KEY must be set')
  }

  const body: Record<string, unknown> = {
    messages: [
      { author: 'USER', fragments: [{ text: args.message }] },
    ],
    inclusions: buildInclusions(args.filters),
  }
  if (args.conversationId) body.chatId = args.conversationId

  const res = await fetch(`${base.replace(/\/$/, '')}/rest/api/v1/chat`, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${key}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Glean Chat API ${res.status}: ${text || res.statusText}`)
  }

  const data = await res.json() as any
  return mapResponse(data)
}

function buildInclusions (filters: GleanScopeFilters): Record<string, unknown> | undefined {
  const inclusions: Record<string, unknown> = {}
  if (filters.datasources?.length) {
    inclusions.containerSpecs = filters.datasources.map(d => ({ datasource: d }))
  }
  if (filters.facetFilters?.length) {
    inclusions.facetFilters = filters.facetFilters
  }
  return Object.keys(inclusions).length ? inclusions : undefined
}

function mapResponse (data: any): GleanChatResult {
  const lastAssistant = (data?.messages || [])
    .filter((m: any) => m?.author === 'GLEAN_AI' || m?.author === 'ASSISTANT')
    .pop()

  const fragments: any[] = lastAssistant?.fragments || []
  const answer = fragments
    .map(f => f?.text || '')
    .filter(Boolean)
    .join('')

  const citations: Citation[] = []
  for (const f of fragments) {
    for (const c of (f?.citations || [])) {
      const src = c?.sourceDocument || c?.trackingToken || {}
      citations.push({
        title: src?.title || c?.title || 'source',
        url: src?.url || c?.url,
        snippet: c?.snippet,
      })
    }
  }

  return {
    answer: answer || '(no answer)',
    citations,
    conversationId: data?.chatId,
  }
}
