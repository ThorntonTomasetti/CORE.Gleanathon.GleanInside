export type ChatRole = 'user' | 'assistant'

export interface Citation {
  title: string
  url?: string
  snippet?: string
}

export interface ChatMessage {
  role: ChatRole
  text: string
  citations?: Citation[]
}

export interface ChatRequest {
  appId: string
  message: string
  conversationId?: string
  agentId?: string
}

export interface ChatResponse {
  answer: string
  citations: Citation[]
  conversationId?: string
}
