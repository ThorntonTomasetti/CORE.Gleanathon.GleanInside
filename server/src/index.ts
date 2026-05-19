import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { chatRouter } from './routes/chat.js'

const app = express()

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true,
}))
app.use(express.json({ limit: '256kb' }))

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/api/chat', chatRouter)

const port = Number(process.env.PORT || 3001)
app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`)
  console.log(`[server] allowed origins: ${allowedOrigins.join(', ') || '(any)'}`)
})
