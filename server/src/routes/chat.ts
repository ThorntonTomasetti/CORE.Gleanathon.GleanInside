import { Router } from 'express'
import { z } from 'zod'
import { getScope } from '../appScopes.js'
import { gleanAgentRun, gleanChat, gleanUploadFile } from '../glean.js'

const Attachment = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  data: z.string().min(1),  // base64
})

const Body = z.object({
  appId: z.string().min(1),
  message: z.string().min(1).max(4000),
  conversationId: z.string().optional(),
  agentId: z.string().min(1).optional(),
  attachment: Attachment.optional(),
})

export const chatRouter: Router = Router()

chatRouter.post('/', async (req, res) => {
  const parsed = Body.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid request', details: parsed.error.flatten() })
  }
  const { appId, message, conversationId, agentId, attachment } = parsed.data

  const scope = getScope(appId)
  if (!scope) {
    return res.status(404).json({ error: `unknown appId: ${appId}` })
  }

  try {
    let fileId: string | undefined
    if (attachment) {
      const buffer = Buffer.from(attachment.data, 'base64')
      fileId = await gleanUploadFile({
        filename: attachment.name,
        mimeType: attachment.type,
        data: buffer,
        chatId: conversationId,
      }).catch(err => {
        console.warn('[chat] file upload failed (continuing without attachment):', err.message)
        return undefined
      })
    }

    // Chat API is the only surface that supports file attachments (citation on fragment).
    // Agent API is text-only — fall back to Chat when a file is present.
    const result = (agentId && !fileId)
      ? await gleanAgentRun({ agentId, message, conversationId })
      : await gleanChat({ message, conversationId, fileId, filters: scope.filters })
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
