/**
 * CTA Buttons Component - Static Component
 *
 * Call-to-action buttons with enhanced hover effects and 2C brand styling
 */

interface CtaButtonsProps {
  className?: string
  primaryText?: string
  primaryHref?: string
  secondaryText?: string
  secondaryHref?: string
}

export default function CtaButtons({
  className = '',
  primaryText = '开始使用',
  primaryHref = '/register',
  secondaryText = '查看文档',
  secondaryHref = '/docs',
}: CtaButtonsProps) {
  return (
    <div class={`flex flex-col items-center justify-center gap-4 sm:flex-row ${className}`}>
      {/* Primary CTA - Gradient button with hover animation */}
      <a
        href={primaryHref}
        class="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-100"
      >
        <span class="absolute inset-0 bg-gradient-to-r from-sky-700 to-indigo-700 opacity-0 transition-opacity group-hover:opacity-100" />
        <span class="relative">{primaryText}</span>
        <svg
          class="relative h-5 w-5 transition-transform group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </a>

      {/* Secondary CTA - Outlined button with hover effects */}
      <a
        href={secondaryHref}
        class="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-8 py-4 font-semibold text-slate-900 shadow-sm transition-all hover:border-sky-400 hover:bg-slate-50 hover:shadow-md active:scale-95"
      >
        <span>{secondaryText}</span>
        <svg
          class="h-5 w-5 transition-transform group-hover:translate-x-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </a>
    </div>
  )
}
