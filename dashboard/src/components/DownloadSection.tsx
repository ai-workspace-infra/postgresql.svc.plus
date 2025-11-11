'use client'
import clsx from 'clsx'

import { useLanguage } from '../i18n/LanguageProvider'
import { translations } from '../i18n/translations'
import { designTokens, type PageVariant } from '@theme/designTokens'

const downloads = [
  { name: 'XCloudFlow', links: ['macOS', 'Windows', 'Linux'] },
  { name: 'KubeGuard', links: ['macOS', 'Windows', 'Linux'] },
  { name: 'XConfig', links: ['macOS', 'Windows', 'Linux'] },
  { name: 'XScopeHub', links: [['GitHub', 'https://github.com/svc-design/XScopeHub']] },
  {
    name: 'Navi',
    links: ['macOS', 'Windows', 'Linux', ['GitHub', 'https://github.com/svc-design/Navi']],
  },
  {
    name: 'XStream',
    links: [
      ['macOS', 'https://artifact.svc.plus/xstream/macos/stable/xstream-release-v0.2.0.dmg'],
      ['Docs', 'https://artifact.svc.plus/xstream/macos/docs/'],
      ['Windows', 'https://artifact.svc.plus/xstream-windows-latest/'],
      ['Linux', 'https://artifact.svc.plus/xstream-linux-latest/'],
      ['Android', '#'],
      ['iOS', '#'],
    ],
  },
]

type DownloadSectionProps = {
  variant?: PageVariant
}

export default function DownloadSection({ variant = 'homepage' }: DownloadSectionProps) {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <section
      id="download"
      className={clsx(
        'relative',
        designTokens.spacing.section[variant],
        variant === 'homepage' ? 'bg-transparent' : 'bg-brand-surface/30'
      )}
    >
      <div className={clsx(designTokens.layout.container, 'flex flex-col gap-12')}>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">{t.downloadTitle}</h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">{t.downloadSubtitle}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {downloads.map((item) => (
            <div
              key={item.name}
              className={clsx(
                designTokens.cards.base,
                designTokens.transitions[variant],
                'flex flex-col gap-4 p-6'
              )}
            >
              <h3 className="text-xl font-semibold text-slate-900">{item.name}</h3>
              <div className="flex flex-wrap gap-3">
                {item.links.map((link) =>
                  typeof link === 'string' ? (
                    <a
                      key={link}
                      href="#"
                      className={clsx(
                        designTokens.buttons.base,
                        designTokens.buttons.palette.primary,
                        designTokens.buttons.shape[variant],
                        designTokens.transitions[variant]
                      )}
                    >
                      {link}
                    </a>
                  ) : (
                    <a
                      key={link[0]}
                      href={link[1]}
                      className={clsx(
                        designTokens.buttons.base,
                        designTokens.buttons.palette.primary,
                        designTokens.buttons.shape[variant],
                        designTokens.transitions[variant]
                      )}
                    >
                      {link[0]}
                    </a>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
