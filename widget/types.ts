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

export interface ChatAttachment {
  name: string
  type: string
  data: string  // base64
}

export interface ChatRequest {
  appId: string
  message: string
  conversationId?: string
  attachment?: ChatAttachment
}

export interface ChatResponse {
  answer: string
  citations: Citation[]
  conversationId?: string
}
