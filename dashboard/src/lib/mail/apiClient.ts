'use client'

import type {
  ClassifyResponse,
  ComposePayload,
  MailInboxResponse,
  MailMessageDetail,
  NamespacePolicy,
  ReplySuggestionRequest,
  ReplySuggestionResponse,
  SummarizeRequest,
  SummarizeResponse,
} from './types'
import { buildTenantHeaders } from './auth'

const MAIL_API_BASE = '/api/mail'

async function request<T>(path: string, init: RequestInit & { tenantId: string }): Promise<T> {
  const { tenantId, headers, ...rest } = init
  const response = await fetch(`${MAIL_API_BASE}${path}`, {
    ...rest,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...buildTenantHeaders(tenantId),
      ...(headers as Record<string, string> | undefined),
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const message = await response.text().catch(() => 'Request failed')
    throw new Error(message || `Failed to fetch ${path}`)
  }

  if (response.status === 204) {
    return null as T
  }

  return (await response.json()) as T
}

export function fetchInbox(tenantId: string, params: { cursor?: string | null; pageSize?: number; label?: string | null; q?: string | null }) {
  const url = new URL(`${MAIL_API_BASE}/inbox`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
  if (params.cursor) {
    url.searchParams.set('cursor', params.cursor)
  }
  if (params.pageSize) {
    url.searchParams.set('pageSize', String(params.pageSize))
  }
  if (params.label) {
    url.searchParams.set('label', params.label)
  }
  if (params.q) {
    url.searchParams.set('q', params.q)
  }
  return request<MailInboxResponse>(`${url.pathname}${url.search}`, { method: 'GET', tenantId })
}

export function fetchMessage(tenantId: string, messageId: string) {
  return request<MailMessageDetail>(`/message/${messageId}`, { method: 'GET', tenantId })
}

export function sendMessage(tenantId: string, payload: ComposePayload) {
  return request<{ success: boolean; message: MailMessageDetail }>(`/send`, {
    method: 'POST',
    tenantId,
    body: JSON.stringify(payload),
  })
}

export function deleteMessage(tenantId: string, messageId: string) {
  return request<{ success: boolean }>(`/message/${messageId}`, {
    method: 'DELETE',
    tenantId,
  })
}

export function summarizeMessage(tenantId: string, payload: SummarizeRequest) {
  return request<SummarizeResponse>(`/ai/summarize`, {
    method: 'POST',
    tenantId,
    body: JSON.stringify(payload),
  })
}

export function suggestReplies(tenantId: string, payload: ReplySuggestionRequest) {
  return request<ReplySuggestionResponse>(`/ai/reply-suggest`, {
    method: 'POST',
    tenantId,
    body: JSON.stringify(payload),
  })
}

export function classifyMessage(tenantId: string, messageId: string) {
  return request<ClassifyResponse>(`/ai/classify`, {
    method: 'POST',
    tenantId,
    body: JSON.stringify({ messageId }),
  })
}

export function fetchNamespacePolicy(tenantId: string) {
  return request<NamespacePolicy>(`/namespace`, {
    method: 'GET',
    tenantId,
  })
}

export function updateNamespacePolicy(tenantId: string, policy: Partial<NamespacePolicy>) {
  return request<NamespacePolicy>(`/namespace`, {
    method: 'PUT',
    tenantId,
    body: JSON.stringify(policy),
  })
}
