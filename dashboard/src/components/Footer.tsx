import { BookOpen, Github, Globe, Link, ShieldCheck } from 'lucide-react'

export default function Footer() {
  const socials = [
    { label: 'GitHub', icon: Github, href: 'https://github.com' },
    { label: 'Docs', icon: BookOpen, href: '#' },
    { label: 'Globe', icon: Globe, href: '#' },
    { label: 'API', icon: Link, href: '#' },
  ]

  return (
    <footer className="mt-12 flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300">
      <div className="flex items-center justify-center gap-3">
        {socials.map(({ label, icon: Icon, href }) => (
          <a
            key={label}
            href={href}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-indigo-400/50 hover:text-indigo-100"
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span className="sr-only">{label}</span>
          </a>
        ))}
      </div>
    </footer>
  )
}
