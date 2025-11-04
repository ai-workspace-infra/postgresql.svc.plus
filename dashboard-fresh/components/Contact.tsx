'use client'
import { useLanguage } from '../i18n/LanguageProvider'
import { translations } from '../i18n/translations'

export default function Contact() {
  const { language } = useLanguage()
  const t = translations[language]
  const description =
    t.contactDescription ??
    'Share your feedback or feature ideas and we will respond as soon as possible. For technical help, reach us via email.'
  const emailLabel = t.contactEmailLabel ?? 'Technical support email'
  const email = t.contactEmail ?? 'manbuzhe2008@gmail.com'

  return (
    <section id="contact" className="py-20 bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">{t.contactTitle}</h2>
        {description ? <p className="text-lg text-gray-700 mb-6">{description}</p> : null}
        <div className="inline-block text-left">
          <span className="block text-sm font-medium uppercase tracking-wide text-gray-500 mb-1">{emailLabel}</span>
          <a
            href={`mailto:${email}`}
            className="text-xl font-semibold text-purple-600 hover:text-purple-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            {email}
          </a>
        </div>
      </div>
    </section>
  )
}
