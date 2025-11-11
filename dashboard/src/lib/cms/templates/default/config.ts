import type { CommonHomeLayoutConfig } from '@templates/layouts/commonHome'

export const defaultHomeLayoutConfig: CommonHomeLayoutConfig = {
  rootClassName: 'relative min-h-screen bg-brand-surface text-brand-navy antialiased',
  hero: {
    sectionClassName: 'relative isolate overflow-hidden py-24 sm:py-28',
    overlays: ['absolute inset-0 bg-gradient-to-b from-white via-white/80 to-transparent'],
    containerClassName: 'relative px-8',
    contentClassName: 'mx-auto w-full max-w-6xl',
    slot: {
      key: 'ProductMatrix',
    },
  },
  content: {
    sectionClassName: 'relative isolate py-20 sm:py-24',
    overlays: ['absolute inset-x-0 top-0 h-px bg-brand-border/70'],
    containerClassName: 'relative px-8',
    contentClassName: 'mx-auto w-full max-w-6xl',
    gridClassName: 'grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-12',
    slots: [
      { key: 'ArticleFeed' },
      { key: 'CommunityFeed' },
      { key: 'Sidebar' },
    ],
  },
}
