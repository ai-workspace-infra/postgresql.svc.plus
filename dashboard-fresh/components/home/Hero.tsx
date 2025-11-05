/**
 * Hero Section - Static Component
 *
 * Improved design with:
 * - Enhanced typography (48-60px headings)
 * - High contrast (text-slate-900)
 * - Proper spacing (pt-16 md:pt-24, pb-20 md:pb-32)
 * - Text width constraints (max-w-[70ch])
 * - Gradient background with 2C brand atmosphere
 */

interface HeroProps {
  className?: string
}

export default function Hero({ className = '' }: HeroProps) {
  return (
    <section
      class={`relative overflow-hidden bg-gradient-to-br from-sky-50 via-indigo-50/30 to-white pt-16 pb-20 md:pt-24 md:pb-32 ${className}`}
    >
      {/* Decorative blur elements for 2C visual appeal */}
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <div class="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />
        <div class="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-indigo-200/20 blur-3xl" />
        <div class="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-purple-200/20 blur-3xl" />
      </div>

      <div class="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div class="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div class="mb-8 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm transition-all hover:border-sky-300 hover:shadow-md">
            <span class="flex h-2 w-2">
              <span class="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-sky-400 opacity-75" />
              <span class="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
            </span>
            <span class="text-sm font-semibold text-slate-900">
              全新升级 · 统一云原生控制平面
            </span>
          </div>

          {/* Main Heading - Improved typography */}
          <h1 class="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            <span class="block">统一身份与权限</span>
            <span class="mt-2 block bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              赋能云原生应用
            </span>
          </h1>

          {/* Description - High contrast with text width constraints */}
          <p class="mx-auto mb-8 max-w-[70ch] text-lg leading-relaxed text-slate-600 sm:text-xl">
            XControl 是一款现代化的云原生身份认证与访问控制平台，为您的应用提供企业级安全保障。
            集成多因素认证、细粒度权限管理与审计日志，助力您构建安全可靠的云原生生态。
          </p>

          {/* Highlight Features List */}
          <div class="mx-auto mb-10 max-w-2xl">
            <ul class="grid gap-3 text-left sm:grid-cols-2">
              <li class="flex items-start gap-2 text-slate-700">
                <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-base">企业级多因素认证 (MFA)</span>
              </li>
              <li class="flex items-start gap-2 text-slate-700">
                <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-base">细粒度权限控制 (RBAC/ABAC)</span>
              </li>
              <li class="flex items-start gap-2 text-slate-700">
                <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-base">完整审计日志与合规支持</span>
              </li>
              <li class="flex items-start gap-2 text-slate-700">
                <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-base">云原生架构，开箱即用</span>
              </li>
            </ul>
          </div>

          {/* CTA Buttons - Will be replaced by CtaButtons component */}
          <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/register"
              class="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-100"
            >
              <span class="absolute inset-0 bg-gradient-to-r from-sky-700 to-indigo-700 opacity-0 transition-opacity group-hover:opacity-100" />
              <span class="relative">开始使用</span>
              <svg class="relative h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>

            <a
              href="/docs"
              class="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-8 py-4 font-semibold text-slate-900 shadow-sm transition-all hover:border-sky-400 hover:bg-slate-50 hover:shadow-md active:scale-95"
            >
              <span>查看文档</span>
              <svg class="h-5 w-5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </a>
          </div>

          {/* Trust indicators */}
          <div class="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <div class="flex items-center gap-2">
              <svg class="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>SOC 2 认证</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="h-5 w-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>端到端加密</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>99.99% 可用性</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
