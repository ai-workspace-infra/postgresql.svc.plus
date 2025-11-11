import { ChevronDown } from 'lucide-react'

type ProductFaqProps = {
  lang: 'zh' | 'en'
}

const FAQ_CONTENT = {
  zh: [
    {
      question: '是否完全开源？支持哪些商业化形态？',
      answer: '核心代码开源，并提供自建、托管、按量与订阅 SaaS 多种形态。',
    },
    {
      question: '是否支持多设备与多平台？',
      answer: '支持 Windows / macOS / Linux，多设备可同时登录与切换。',
    },
    {
      question: '是否内置观测与限流保护？',
      answer: '客户端与边缘节点具备观测、流量控制及异常防护能力。',
    },
    {
      question: '如何参与贡献？',
      answer: '欢迎在 GitHub 仓库提交 Issue / PR，并加入社区讨论。',
    },
  ],
  en: [
    {
      question: 'Is it fully open source? What commercial models are available?',
      answer: 'The core is open source with self-hosted, managed, pay-as-you-go, and SaaS plans.',
    },
    {
      question: 'Does it support multiple devices and platforms?',
      answer: 'Yes. Windows, macOS, and Linux with seamless device switching.',
    },
    {
      question: 'Are observability and rate limiting built in?',
      answer: 'Clients and edge nodes ship with telemetry, throttling, and protections.',
    },
    {
      question: 'How can I contribute?',
      answer: 'Open GitHub issues or pull requests and join the community discussions.',
    },
  ],
}

export default function ProductFaq({ lang }: ProductFaqProps) {
  const items = FAQ_CONTENT[lang]

  return (
    <section id="faq" aria-labelledby="faq-title" className="py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 id="faq-title" className="text-3xl font-bold text-slate-900">
          FAQ
        </h2>
        <div className="mt-8 space-y-4">
          {items.map(({ question, answer }) => (
            <details key={question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between text-left text-base font-semibold text-slate-900">
                {question}
                <ChevronDown className="h-5 w-5 text-slate-400 transition group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="mt-3 text-sm text-slate-600">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
