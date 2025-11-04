'use client'
import { useLanguage } from '../i18n/LanguageProvider'
import { translations } from '../i18n/translations'

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

export default function DownloadSection() {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <section id="download" className="py-20 bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">{t.downloadTitle}</h2>
          <p className="text-gray-600">{t.downloadSubtitle}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {downloads.map((item) => (
            <div key={item.name} className="bg-white rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">{item.name}</h3>
              <div className="flex flex-wrap gap-2">
                {item.links.map((link) =>
                  typeof link === 'string' ? (
                    <a key={link} href="#" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 text-sm">
                      {link}
                    </a>
                  ) : (
                    <a key={link[0]} href={link[1]} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 text-sm">
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
