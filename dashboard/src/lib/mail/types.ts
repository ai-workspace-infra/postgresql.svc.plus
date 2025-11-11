export type MailAddress = {
  name?: string
  email: string
}

export type MailAttachment = {
  id: string
  fileName: string
  contentType: string
  size: number
  downloadUrl?: string
}

export type MailListMessage = {
  id: string
  subject: string
  snippet: string
  from: MailAddress
  to: MailAddress[]
  date: string
  unread: boolean
  starred?: boolean
  labels: string[]
  hasAttachments?: boolean
  aiSummary?: {
    preview: string
    tone?: string
  }
}

export type MailMessageDetail = {
  id: string
  subject: string
  snippet: string
  from: MailAddress
  to: MailAddress[]
  cc?: MailAddress[]
  bcc?: MailAddress[]
  date: string
  unread: boolean
  starred?: boolean
  labels: string[]
  text?: string
  html?: string
  attachments?: MailAttachment[]
  aiInsights?: MailInsights
}

export type MailInsights = {
  summary: string
  bullets: string[]
  actions: string[]
  tone: string
  suggestions?: string[]
}

export type MailInboxResponse = {
  messages: MailListMessage[]
  labels: MailLabel[]
  unreadCount: number
  nextCursor?: string | null
}

export type MailLabel = {
  id: string
  name: string
  color?: string
  unread?: number
}

export type ComposePayload = {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  text?: string
  html?: string
  attachments?: string[]
}

export type NamespacePolicy = {
  model: string
  temperature: number
  maxTokens: number
  rateLimitPerMinute: number
  vectorIndex?: string
  policy?: string
  updatedAt: string
}

export type ReplySuggestionRequest = {
  messageId: string
  style?: 'concise' | 'formal' | 'technical'
  language?: 'zh' | 'en'
}

export type ReplySuggestionResponse = {
  suggestions: string[]
}

export type SummarizeRequest = {
  messageId?: string
  raw?: string
}

export type SummarizeResponse = MailInsights

export type ClassifyResponse = {
  labels: string[]
}
