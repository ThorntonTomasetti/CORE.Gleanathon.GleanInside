import { Router } from 'express'
import { z } from 'zod'
import { getScope } from '../appScopes.js'
import { gleanAgentRun, gleanChat } from '../glean.js'

const Body = z.object({
  appId: z.string().min(1),
  message: z.string().min(1).max(4000),
  conversationId: z.string().optional(),
  agentId: z.string().min(1).optional(),
})

export const chatRouter: Router = Router()

chatRouter.post('/', async (req, res) => {
  const parsed = Body.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid request', details: parsed.error.flatten() })
  }
  const { appId, message, conversationId, agentId } = parsed.data

  const scope = getScope(appId)
  if (!scope) {
    return res.status(404).json({ error: `unknown appId: ${appId}` })
  }

  try {
    const result = agentId
      ? await gleanAgentRun({ agentId, message, conversationId })
      : await gleanChat({ message, conversationId, filters: scope.filters })
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
