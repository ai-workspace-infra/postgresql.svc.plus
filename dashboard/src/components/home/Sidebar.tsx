'use client'

import { useLanguage } from '../../i18n/LanguageProvider'
const sidebarContent = {
  zh: {
    title: '文档与社区',
    sections: [
      {
        slug: 'docs',
        title: '文档与教程',
        items: [
          { label: '产品文档', description: '按模块拆分的接口与操作指南。', href: '#' },
          { label: '快速入门', description: '5 分钟完成首个项目的配置与发布。', href: '#' },
          { label: '操作指南', description: '常见任务的分步操作示例。', href: '#' },
        ],
      },
      {
        slug: 'practices',
        title: '最佳实践',
        items: [
          { label: 'GitOps 标准化', description: '流水线模板、审批与回滚策略。', href: '#' },
          { label: 'IaC 资产管理', description: 'Terraform 与 Pulumi 资产治理指引。', href: '#' },
          { label: '多云治理手册', description: '跨区域合规、网络隔离与零信任。', href: '#' },
        ],
      },
      {
        slug: 'community',
        title: '社区与支持',
        items: [
          { label: '发布说明', description: '版本更新、缺陷修复与补丁计划。', href: '#' },
          { label: '社区日程', description: 'Workshop、Live Demo 与用户群活动。', href: '#' },
          { label: '加入讨论', description: '提交 Issue 或加入 Slack/微信群。', href: '#' },
        ],
      },
    ],
  },
  en: {
    title: 'Documentation & Community',
    sections: [
      {
        slug: 'docs',
        title: 'Docs & Tutorials',
        items: [
          { label: 'Product Docs', description: 'Module-specific API and operations guides.', href: '#' },
          { label: 'Quickstart', description: 'Configure and ship your first project in minutes.', href: '#' },
          { label: 'How-to Guides', description: 'Step-by-step recipes for recurring tasks.', href: '#' },
        ],
      },
      {
        slug: 'practices',
        title: 'Best Practices',
        items: [
          { label: 'GitOps Playbooks', description: 'Pipeline templates, approvals, and rollbacks.', href: '#' },
          { label: 'IaC Governance', description: 'Guidance for Terraform and Pulumi asset control.', href: '#' },
          { label: 'Multi-Cloud Handbook', description: 'Compliance, network isolation, and Zero Trust.', href: '#' },
        ],
      },
      {
        slug: 'community',
        title: 'Community & Support',
        items: [
          { label: 'Release Notes', description: 'Updates, fixes, and patch availability.', href: '#' },
          { label: 'Community Calendar', description: 'Workshops, live demos, and user groups.', href: '#' },
          { label: 'Join the Conversation', description: 'File issues or join Slack/WeChat.', href: '#' },
        ],
      },
    ],
  },
}

export default function Sidebar() {
  const { language } = useLanguage()
  const data = sidebarContent[language]

  return (
    <aside className="flex h-full w-full flex-col gap-5 rounded-lg border border-black/10 bg-white p-5 text-slate-800">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{data.title}</p>
        <p className="text-[13px] leading-relaxed text-slate-600">
          {language === 'zh'
            ? '查阅文档、最佳实践与社区讨论，保持交付与治理同频。'
            : 'Stay aligned with docs, practices, and community conversations.'}
        </p>
      </div>
      <div className="space-y-4">
        {data.sections.map((section) => (
          <div key={section.slug} className="space-y-2 rounded-md border border-black/10 bg-[#f6f7f9] p-3">
            <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li key={item.label} className="group flex flex-col gap-1">
                  <a
                    href={item.href}
                    className="text-sm font-semibold text-[#3467e9] transition hover:text-[#2957cf]"
                  >
                    {item.label}
                  </a>
                  {item.description && <p className="text-[12px] text-slate-600">{item.description}</p>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  )
}
