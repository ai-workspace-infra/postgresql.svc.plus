import type { MailInboxResponse, MailListMessage, MailMessageDetail, NamespacePolicy } from '@lib/mail/types'

type TenantMailData = {
  inbox: MailListMessage[]
  messages: Record<string, MailMessageDetail>
  namespace: NamespacePolicy
}

const now = Date.now()

const baseMessages: MailListMessage[] = [
  {
    id: 'msg-1001',
    subject: '【故障通报】核心链路延迟恢复通知',
    snippet: '生产集群延迟已恢复至正常指标，详见行动项。',
    from: { name: 'SRE 值班', email: 'sre@svc.plus' },
    to: [{ name: 'Ops 团队', email: 'ops@tenant.io' }],
    date: new Date(now - 5 * 60 * 1000).toISOString(),
    unread: true,
    starred: true,
    labels: ['Incident', 'Priority'],
    hasAttachments: true,
    aiSummary: {
      preview: '延迟恢复，需确认追踪指标。',
      tone: '紧急',
    },
  },
  {
    id: 'msg-1002',
    subject: '月度账单与消耗对账单',
    snippet: '附件包含 5 月份资源使用与费用明细，请于本周内确认。',
    from: { name: 'Finance Robot', email: 'billing@svc.plus' },
    to: [{ name: 'Finance', email: 'finance@tenant.io' }],
    date: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    unread: false,
    labels: ['Billing'],
    hasAttachments: true,
    aiSummary: {
      preview: '账单结算提醒，需核对折扣。',
      tone: '正式',
    },
  },
  {
    id: 'msg-1003',
    subject: 'AI 助手联调会议记录',
    snippet: '会议纪要包含下一步联调行动项与 SLA 讨论。',
    from: { name: '产品经理', email: 'pm@svc.plus' },
    to: [{ name: 'AI 团队', email: 'ai@tenant.io' }],
    date: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
    unread: false,
    labels: ['Product'],
    aiSummary: {
      preview: '提炼三条关键任务。',
      tone: '合作',
    },
  },
  {
    id: 'msg-1004',
    subject: '【提醒】IAM 权限矩阵变更审批',
    snippet: '审批单待确认，涉及新的只读角色授权，请于 24 小时内处理。',
    from: { name: 'Access Bot', email: 'iam@svc.plus' },
    to: [{ name: 'Security', email: 'sec@tenant.io' }],
    date: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
    unread: true,
    labels: ['Security'],
    aiSummary: {
      preview: '审批截止前需确认。',
      tone: '提醒',
    },
  },
]

const detailMap: Record<string, MailMessageDetail> = {
  'msg-1001': {
    ...baseMessages[0],
    text: '生产链路延迟恢复。请确认后续监控指标与复盘会议安排。',
    html: '<p>生产链路延迟已恢复。</p><ul><li>核对 Prometheus 延迟指标</li><li>更新状态页面</li><li>准备 18:00 复盘会议</li></ul>',
    attachments: [
      {
        id: 'att-1',
        fileName: 'incident-report.pdf',
        contentType: 'application/pdf',
        size: 234567,
        downloadUrl: '#',
      },
    ],
    aiInsights: {
      summary: '生产链路延迟恢复，需跟进指标及复盘会议。',
      bullets: ['Prometheus 延迟恢复', '状态页面需更新', '18:00 复盘会议'],
      actions: ['确认状态页', '同步客户邮件', '准备复盘材料'],
      tone: '紧急',
      suggestions: [
        '感谢通知，已安排团队核查 Prometheus 指标。',
        '收到，我们将于 18:00 准备复盘材料。',
        '请同步可能影响的客户列表，方便统一公告。',
      ],
    },
  },
  'msg-1002': {
    ...baseMessages[1],
    text: '随信附上 5 月份账单，包含折扣与超额费用明细，请在本周内完成对账。',
    attachments: [
      {
        id: 'att-2',
        fileName: 'may-usage.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 54567,
        downloadUrl: '#',
      },
    ],
    aiInsights: {
      summary: '账单需要财务团队在本周内确认。',
      bullets: ['包含折扣明细', '有部分资源超额', '需在周五前回复'],
      actions: ['核对折扣', '确认超额原因', '回邮确认'],
      tone: '正式',
      suggestions: ['已收悉，我们将在周四前完成对账并回复。'],
    },
  },
  'msg-1003': {
    ...baseMessages[2],
    html: '<p>联调会议要点：</p><ol><li>六月上线 Beta，需补充监控指标</li><li>AI 模型回退策略需评审</li><li>下一次联调会议安排在周五上午</li></ol>',
    aiInsights: {
      summary: '会议聚焦上线计划、模型回退与下次会议时间。',
      bullets: ['六月 Beta 上线', '确认模型回退策略', '周五上午继续联调'],
      actions: ['同步监控指标清单', '准备回退方案文档', '发送会议邀请'],
      tone: '合作',
    },
  },
  'msg-1004': {
    ...baseMessages[3],
    text: 'IAM 角色矩阵变更涉及新建只读角色，需要安全团队审批。',
    aiInsights: {
      summary: '安全团队需在 24 小时内确认新角色审批。',
      bullets: ['新增只读角色', '审批截止 24 小时内', '需评估权限边界'],
      actions: ['审阅角色权限', '评估风险', '确认审批或驳回'],
      tone: '提醒',
    },
  },
}

const TENANT_DATA: Record<string, TenantMailData> = {
  'tenant-alpha': {
    inbox: baseMessages,
    messages: detailMap,
    namespace: {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 2048,
      rateLimitPerMinute: 60,
      vectorIndex: 's3://tenant-alpha-mail',
      policy: '{"blockedKeywords": ["NDA", "秘密"]}',
      updatedAt: new Date(now - 3600 * 1000).toISOString(),
    },
  },
  default: {
    inbox: baseMessages,
    messages: detailMap,
    namespace: {
      model: 'gpt-4o-mini',
      temperature: 0.5,
      maxTokens: 2048,
      rateLimitPerMinute: 30,
      vectorIndex: 's3://default-mail',
      policy: '{"allowExternal": true}',
      updatedAt: new Date(now - 7200 * 1000).toISOString(),
    },
  },
}

export function resolveTenantId(raw: string | null | undefined) {
  if (!raw) {
    return 'default'
  }
  return TENANT_DATA[raw] ? raw : 'default'
}

export function getInbox(tenantId: string): MailInboxResponse {
  const data = TENANT_DATA[tenantId] ?? TENANT_DATA.default
  return {
    messages: data.inbox,
    labels: [
      { id: 'Incident', name: 'Incident', color: '#f97316', unread: data.inbox.filter((item) => item.unread && item.labels.includes('Incident')).length },
      { id: 'Billing', name: 'Billing', color: '#2563eb', unread: data.inbox.filter((item) => item.unread && item.labels.includes('Billing')).length },
      { id: 'Security', name: 'Security', color: '#7c3aed', unread: data.inbox.filter((item) => item.unread && item.labels.includes('Security')).length },
      { id: 'Product', name: 'Product', color: '#0f766e', unread: data.inbox.filter((item) => item.unread && item.labels.includes('Product')).length },
    ],
    unreadCount: data.inbox.filter((item) => item.unread).length,
    nextCursor: null,
  }
}

export function getMessage(tenantId: string, id: string): MailMessageDetail | null {
  const data = TENANT_DATA[tenantId] ?? TENANT_DATA.default
  return data.messages[id] ?? null
}

export function getNamespace(tenantId: string): NamespacePolicy {
  const data = TENANT_DATA[tenantId] ?? TENANT_DATA.default
  return data.namespace
}

export function updateNamespace(tenantId: string, patch: Partial<NamespacePolicy>): NamespacePolicy {
  const key = TENANT_DATA[tenantId] ? tenantId : 'default'
  const current = TENANT_DATA[key].namespace
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() }
  TENANT_DATA[key].namespace = next
  return next
}
