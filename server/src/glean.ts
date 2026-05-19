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
  fileId?: string
  filters: GleanScopeFilters
}

export async function gleanUploadFile (args: {
  filename: string
  mimeType: string
  data: Buffer
  chatId?: string
}): Promise<string> {
  const base = process.env.GLEAN_BASE_URL
  const key = process.env.GLEAN_API_KEY
  if (!base || !key) throw new Error('GLEAN_BASE_URL and GLEAN_API_KEY must be set')

  const form = new FormData()
  form.append('file', new Blob([args.data], { type: args.mimeType }), args.filename)
  if (args.chatId) form.append('chatId', args.chatId)

  const res = await fetch(`${base.replace(/\/$/, '')}/rest/api/v1/uploadchatfiles`, {
    method: 'POST',
    headers: { 'authorization': `Bearer ${key}` },
    body: form,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Glean uploadchatfiles ${res.status}: ${text || res.statusText}`)
  }

  const data = await res.json() as any
  console.log('[glean] uploadchatfiles response:', JSON.stringify(data))
  const fileId = data?.fileId ?? data?.id ?? data?.fileIds?.[0]
  if (!fileId) throw new Error(`Glean uploadchatfiles: no fileId in response — ${JSON.stringify(data)}`)
  return fileId
}

interface GleanAgentRunArgs {
  agentId: string
  message: string
  conversationId?: string
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

  const fragment: Record<string, unknown> = { text: args.message }
  if (args.fileId) fragment.citation = { fileId: args.fileId }

  const body: Record<string, unknown> = {
    messages: [
      { author: 'USER', fragments: [fragment] },
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

/**
 * Runs a Glean Agent by id. Endpoint: POST /rest/api/v1/agents/runs/wait.
 * The `input` field name (`message` below) must match an input parameter
 * defined on the agent in Glean — adjust if your agent uses a different key.
 */
export async function gleanAgentRun (args: GleanAgentRunArgs): Promise<GleanChatResult> {
  const base = process.env.GLEAN_BASE_URL
  const key = process.env.GLEAN_API_KEY
  if (!base || !key) {
    throw new Error('GLEAN_BASE_URL and GLEAN_API_KEY must be set')
  }

  const body: Record<string, unknown> = {
    agent_id: args.agentId,
    input: { message: args.message },
  }
  if (args.conversationId) body.chat_id = args.conversationId

  const headers: Record<string, string> = {
    'authorization': `Bearer ${key}`,
    'content-type': 'application/json',
  }

  const url = `${base.replace(/\/$/, '')}/rest/api/v1/agents/runs/wait`
  console.log('[glean] agent request', { url, bodyKeys: Object.keys(body) })

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[glean] agent error', res.status, 'body:', text.slice(0, 1000), 'response-headers:', Object.fromEntries(res.headers))
    throw new Error(`Glean Agent run ${res.status}: ${text || res.statusText}`)
  }

  const data = await res.json() as any
  return mapAgentResponse(data)
}

function mapAgentResponse (data: any): GleanChatResult {
  // Agents API shape: { messages: [{ role: 'GLEAN_AI', content: [{ text, type }] }] }
  const messages: any[] = Array.isArray(data?.messages) ? data.messages : []
  const lastAssistant = messages
    .filter(m => m?.role === 'GLEAN_AI' || m?.author === 'GLEAN_AI')
    .pop()

  const content: any[] = lastAssistant?.content || lastAssistant?.fragments || []
  const answer = content
    .map(c => c?.text || '')
    .filter(Boolean)
    .join('')

  const citations: Citation[] = []
  for (const c of content) {
    for (const cite of (c?.citations || [])) {
      const src = cite?.sourceDocument || {}
      citations.push({
        title: src?.title || cite?.title || 'source',
        url: src?.url || cite?.url,
        snippet: cite?.snippet,
      })
    }
  }

  return {
    answer: answer || '(no answer)',
    citations,
    conversationId: data?.chat_id || data?.chatId,
  }
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
