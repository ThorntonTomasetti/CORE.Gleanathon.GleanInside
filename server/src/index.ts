import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import { chatRouter } from './routes/chat.js'

const app = express()

const defaultAllowedOrigins = [
  'https://spark.thorntontomasetti.com',
]

const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]))

app.use(cors({
  origin: allowedOrigins,
}))
app.use(express.json({ limit: '256kb' }))

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/api/chat', chatRouter)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const widgetDir = path.resolve(__dirname, '../../dist-widget')
app.use('/widget', express.static(widgetDir))

const port = Number(process.env.PORT || 3001)
app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`)
  console.log(`[server] allowed origins: ${allowedOrigins.join(', ') || '(any)'}`)
})
