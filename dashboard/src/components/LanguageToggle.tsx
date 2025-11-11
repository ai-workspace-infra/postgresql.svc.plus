'use client'
import { useLanguage } from '../i18n/LanguageProvider'

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as 'en' | 'zh')}
      className="bg-gray-100 text-gray-900 border border-gray-300 px-2 py-1 rounded text-sm"
    >
      <option value="en">English</option>
      <option value="zh">中文</option>
    </select>
  )
}
// This component provides a dropdown to toggle between English and Chinese languages.