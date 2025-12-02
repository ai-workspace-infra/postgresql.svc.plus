'use client'

export const dynamic = 'error'

import {
  AppWindow,
  ArrowRight,
  BookOpen,
  Command,
  Layers,
  Link,
  Lock,
  MousePointerClick,
  Play,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
} from 'lucide-react'
import { AppShell } from '@components/common/AppShell'

const heroCards = [
  {
    title: 'Create your app',
    description: 'Add your application and configure the client details to start integrating quickly.',
    icon: PlusCircle,
  },
  {
    title: 'Register your app',
    description: 'Register your application to manage access and configure redirect URIs.',
    icon: ShieldCheck,
  },
  {
    title: 'Deploy your app',
    description: 'Manage your application and users within ZITADEL for secure access.',
    icon: Users,
  },
]

const nextSteps = [
  { title: 'Add a new user to your project', status: 'NEW', icon: Users },
  { title: 'Register a new application', status: 'NEW', icon: AppWindow },
  { title: 'Deploy your application', status: 'READY', icon: Command },
  { title: 'Invite a user', status: 'READY', icon: MousePointerClick },
]

const stats = [
  { value: '~150k', label: 'Applications integrated with ZITADEL' },
  { value: '~330k', label: 'Daily active users' },
  { value: '7', label: 'Go check out our examples & guides' },
]

const shortcuts = [
  { title: 'Get started', description: 'An overview of using ZITADEL', icon: Sparkles },
  { title: 'Creating your application', description: 'Integrate ZITADEL into your application', icon: AppWindow },
  { title: 'More about Authentication', description: 'Understand all about authenticating with ZITADEL', icon: ShieldCheck },
  { title: 'Understanding Authorization', description: 'Scope out all about authorization using ZITADEL', icon: Lock },
  { title: 'Machine-to-Machine', description: 'Integrate ZITADEL into your services', icon: Layers },
  { title: 'Connect via CLI', description: 'Connect ZITADEL with your application via CLI', icon: Terminal },
  { title: 'REST & Admin APIs', description: 'Programmatically integrate ZITADEL into your application', icon: Link },
]

export default function HomePage() {
  return (
    <AppShell>
      <div className="space-y-10 lg:space-y-12">
        <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/80 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-indigo-500/10" aria-hidden />
          <div className="relative">
            <HeroSection />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[320px,1fr] xl:gap-8">
          <div className="space-y-6">
            <NextStepsSection />
            <StatsSection />
          </div>
          <ShortcutsSection />
        </div>
      </div>
    </AppShell>
  )
}

function HeroSection() {
  return (
    <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-8">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <span className="inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-indigo-100">Signed in</span>
          <span>example.tenant.zitadel.cloud</span>
        </div>
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Create, authenticate, deploy</p>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">Get started with ZITADEL</h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Integrate ZITADEL into your application or use one of our samples to get started quickly.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-white shadow-lg shadow-indigo-500/25 transition hover:translate-y-[-1px] hover:bg-indigo-400"
          >
            <PlusCircle className="h-4 w-4" aria-hidden />
            Create Application
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white transition hover:bg-white/10"
          >
            <Play className="h-4 w-4" aria-hidden />
            Try Samples in Playground
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-white transition hover:border-white/40"
          >
            <BookOpen className="h-4 w-4" aria-hidden />
            View Tutorials
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span className="font-semibold text-white">Trusted by your dev team</span>
          <LogoPill label="Vue" />
          <LogoPill label="Svelte" />
          <LogoPill label="Node" />
          <LogoPill label="Django" />
          <LogoPill label="Laravel" />
        </div>
      </div>
      <div className="space-y-3 rounded-2xl border border-white/5 bg-slate-950/40 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        {heroCards.map((card) => (
          <div key={card.title} className="group relative overflow-hidden rounded-xl border border-white/5 bg-slate-900/80 p-4 transition hover:border-indigo-400/50 hover:bg-slate-900/90">
            <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100" aria-hidden>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-sky-400/10" />
            </div>
            <div className="relative flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-indigo-200">
                <card.icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">{card.title}</h3>
                <p className="text-sm text-slate-300">{card.description}</p>
                <button className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-200 transition hover:text-white">
                  Go to action
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function NextStepsSection() {
  return (
    <section className="rounded-2xl border border-white/5 bg-slate-900/80 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
      <header className="flex items-center justify-between gap-3 text-sm text-slate-300">
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Your Next Steps</p>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-indigo-200">Data detected</span>
        </div>
        <span className="hidden text-xs text-slate-400 lg:inline">Personalized to your recent activity</span>
      </header>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {nextSteps.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3 rounded-xl border border-white/5 bg-slate-950/40 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.25)]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-200">
              <item.icon className="h-5 w-5" aria-hidden />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-indigo-100">
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5">{item.status}</span>
              </div>
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <button className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-200 transition hover:text-white">
                Learn more
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function StatsSection() {
  return (
    <section className="rounded-2xl border border-white/5 bg-slate-900/80 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/5 bg-slate-950/40 p-4 text-center shadow-[0_20px_80px_rgba(0,0,0,0.25)] md:text-left"
          >
            <div className="text-3xl font-semibold text-white">{stat.value}</div>
            <p className="text-sm text-slate-300">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ShortcutsSection() {
  return (
    <section className="rounded-2xl border border-white/5 bg-slate-900/80 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">More shortcuts</p>
          <p className="text-sm text-slate-300">Save time when integrating ZITADEL</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-indigo-200">
          <button className="rounded-full border border-white/10 bg-white/5 px-3 py-1 transition hover:bg-white/10">Get Started</button>
          <button className="rounded-full border border-white/10 bg-white/5 px-3 py-1 transition hover:bg-white/10">Docs</button>
          <button className="rounded-full border border-white/10 bg-white/5 px-3 py-1 transition hover:bg-white/10">Guides</button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((item) => (
          <a
            key={item.title}
            href="#"
            className="group flex items-start gap-3 rounded-xl border border-white/5 bg-slate-950/40 p-4 transition hover:-translate-y-[1px] hover:border-indigo-400/50 hover:bg-slate-900/80"
          >
            <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-200">
              <item.icon className="h-5 w-5" aria-hidden />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-white">{item.title}</div>
              <p className="text-sm text-slate-300">{item.description}</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-slate-400 transition group-hover:text-indigo-200" aria-hidden />
          </a>
        ))}
      </div>
    </section>
  )
}

function LogoPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white">
      <div className="h-2 w-2 rounded-full bg-emerald-400" />
      {label}
    </span>
  )
}
