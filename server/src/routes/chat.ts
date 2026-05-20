import { Router } from 'express'
import { z } from 'zod'
import { getScope } from '../appScopes.js'
import { gleanAgentRun, gleanChat } from '../glean.js'

const PageContext = z.object({
  url: z.string().max(2000).optional(),
  pageTitle: z.string().max(500).optional(),
  htmlSnippet: z.string().max(10000).optional(),
  activeView: z.string().max(500).optional(),
  metadata: z.record(z.string().max(500)).optional(),
}).optional()

const Body = z.object({
  appId: z.string().min(1),
  message: z.string().min(1).max(4000),
  conversationId: z.string().optional(),
  agentId: z.string().min(1).optional(),
  context: PageContext,
})

export const chatRouter: Router = Router()

chatRouter.post('/', async (req, res) => {
  const parsed = Body.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid request', details: parsed.error.flatten() })
  }
  const { appId, message, conversationId, agentId, context } = parsed.data

  const scope = getScope(appId)
  if (!scope) {
    return res.status(404).json({ error: `unknown appId: ${appId}` })
  }

  try {
    const result = agentId
      ? await gleanAgentRun({ agentId, message, conversationId, context })
      : await gleanChat({ message, conversationId, filters: scope.filters, context })
    return res.json({
      answer: result.answer,
      citations: result.citations,
      conversationId: result.conversationId,
    })
  } catch (err: any) {
    console.error('[chat] glean error', err)
    return res.status(502).json({ error: err?.message || 'upstream error' })
  }
})
