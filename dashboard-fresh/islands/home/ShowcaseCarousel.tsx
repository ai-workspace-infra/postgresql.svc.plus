/**
 * Showcase Carousel Island - Interactive Component
 *
 * Auto-playing carousel with smooth transitions to showcase platform features
 * Uses Preact signals for state management
 */

import { useSignal, useComputed } from '@preact/signals'
import { useEffect } from 'preact/hooks'

interface ShowcaseItem {
  title: string
  description: string
  image: string
  category: string
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    category: '身份认证',
    title: '多因素认证 (MFA)',
    description: '支持 TOTP、SMS、邮件等多种认证方式，保障账户安全',
    image: '/images/showcase/mfa.svg',
  },
  {
    category: '权限管理',
    title: '细粒度访问控制',
    description: '基于角色和属性的权限控制，灵活配置访问策略',
    image: '/images/showcase/rbac.svg',
  },
  {
    category: '审计合规',
    title: '完整审计日志',
    description: '记录所有操作日志，满足合规性要求，支持审计追溯',
    image: '/images/showcase/audit.svg',
  },
  {
    category: '开发者工具',
    title: 'API 与 SDK',
    description: '提供 RESTful API 和多语言 SDK，快速集成到您的应用',
    image: '/images/showcase/api.svg',
  },
]

interface ShowcaseCarouselProps {
  autoPlayInterval?: number
  className?: string
}

export default function ShowcaseCarousel({
  autoPlayInterval = 5000,
  className = '',
}: ShowcaseCarouselProps) {
  const currentIndex = useSignal(0)
  const isPaused = useSignal(false)

  const currentItem = useComputed(() => SHOWCASE_ITEMS[currentIndex.value])

  // Auto-play functionality
  useEffect(() => {
    if (isPaused.value) return

    const interval = setInterval(() => {
      currentIndex.value = (currentIndex.value + 1) % SHOWCASE_ITEMS.length
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [isPaused.value, autoPlayInterval])

  const goToSlide = (index: number) => {
    currentIndex.value = index
  }

  const goToPrevious = () => {
    currentIndex.value = (currentIndex.value - 1 + SHOWCASE_ITEMS.length) % SHOWCASE_ITEMS.length
  }

  const goToNext = () => {
    currentIndex.value = (currentIndex.value + 1) % SHOWCASE_ITEMS.length
  }

  return (
    <section class={`bg-white py-20 md:py-32 ${className}`}>
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div class="mx-auto mb-16 max-w-2xl text-center">
          <p class="mb-3 text-sm font-semibold uppercase tracking-wide text-sky-600">
            核心功能
          </p>
          <h2 class="mb-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            一站式云原生身份与权限解决方案
          </h2>
          <p class="text-lg text-slate-600">
            集成企业级安全功能，助力您快速构建安全可靠的云原生应用
          </p>
        </div>

        {/* Carousel Container */}
        <div
          class="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-xl"
          onMouseEnter={() => (isPaused.value = true)}
          onMouseLeave={() => (isPaused.value = false)}
        >
          {/* Main Content */}
          <div class="grid gap-8 p-8 md:grid-cols-2 md:gap-12 md:p-12 lg:p-16">
            {/* Left: Text Content */}
            <div class="flex flex-col justify-center">
              <span class="mb-4 inline-block w-fit rounded-full bg-sky-100 px-4 py-1.5 text-sm font-semibold text-sky-700">
                {currentItem.value.category}
              </span>

              <h3 class="mb-4 text-3xl font-bold text-slate-900 lg:text-4xl">
                {currentItem.value.title}
              </h3>

              <p class="mb-8 text-lg leading-relaxed text-slate-600">
                {currentItem.value.description}
              </p>

              {/* Navigation Dots */}
              <div class="flex items-center gap-3">
                {SHOWCASE_ITEMS.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    class={`h-2 rounded-full transition-all ${
                      index === currentIndex.value
                        ? 'w-12 bg-sky-600'
                        : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Right: Image/Visual Content */}
            <div class="relative flex items-center justify-center">
              <div class="relative h-80 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 shadow-lg">
                {/* Placeholder for image - Replace with actual images */}
                <div class="flex h-full items-center justify-center">
                  <div class="text-center">
                    <div class="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-white/80 shadow-lg backdrop-blur-sm">
                      <svg class="h-12 w-12 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <p class="text-sm font-medium text-slate-600">
                      {currentItem.value.category}
                    </p>
                  </div>
                </div>

                {/* Image overlay effect */}
                <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
              </div>

              {/* Decorative elements */}
              <div class="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-200/30 blur-2xl" />
              <div class="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-indigo-200/30 blur-2xl" />
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            class="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95"
            aria-label="Previous slide"
          >
            <svg class="h-6 w-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goToNext}
            class="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95"
            aria-label="Next slide"
          >
            <svg class="h-6 w-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Auto-play indicator */}
        {!isPaused.value && (
          <div class="mt-6 text-center">
            <p class="text-sm text-slate-500">
              自动轮播中 · 悬停暂停
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
