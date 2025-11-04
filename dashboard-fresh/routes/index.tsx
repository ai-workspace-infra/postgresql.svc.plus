/**
 * Homepage - Fresh + Deno
 *
 * Main landing page with CMS template or markdown content support
 */

import { Head } from '$fresh/runtime.ts'
import { Handlers, PageProps } from '$fresh/server.ts'
import { FreshState } from '@/middleware.ts'
import { isFeatureEnabled } from '@/lib/featureToggles.ts'
import { renderMarkdownFile } from '@/api/render-markdown.ts'

// Import Islands for client-side interactivity
import MobileMenu from '@/islands/MobileMenu.tsx'
import AccountDropdown from '@/islands/AccountDropdown.tsx'
import SearchDialog from '@/islands/SearchDialog.tsx'
import AskAIButton from '@/islands/AskAIButton.tsx'

// Supported languages
type Language = 'zh' | 'en'

interface MarkdownSection {
  id: string
  title: string
  html: string
  meta: Record<string, unknown>
}

interface HomePageData {
  language: Language
  sections: {
    operations: MarkdownSection
    productSpotlight: MarkdownSection
    news: MarkdownSection
    support: MarkdownSection
    community: MarkdownSection
    resources: MarkdownSection
  }
  cmsEnabled: boolean
  user: { username?: string; email?: string } | null
}

interface ParsedHighlight {
  html: string
}

interface ProductCard {
  title: string
  bodyHtml: string
}

// Define section paths for different languages
const SECTION_PATHS: Record<Language, Record<string, string>> = {
  zh: {
    operations: 'homepage/zh/operations.md',
    productSpotlight: 'homepage/zh/products.md',
    news: 'homepage/zh/news.md',
    support: 'homepage/zh/support.md',
    community: 'homepage/zh/community.md',
    resources: 'homepage/zh/resources.md',
  },
  en: {
    operations: 'homepage/en/operations.md',
    productSpotlight: 'homepage/en/products.md',
    news: 'homepage/en/news.md',
    support: 'homepage/en/support.md',
    community: 'homepage/en/community.md',
    resources: 'homepage/en/resources.md',
  },
}

const DEFAULT_LANGUAGE: Language = 'zh'

async function loadMarkdownSection(path: string, id: string): Promise<MarkdownSection> {
  try {
    const result = await renderMarkdownFile(path)
    return {
      id,
      title: (result.meta.title as string) || '',
      html: result.html,
      meta: result.meta,
    }
  } catch (error) {
    console.error(`Failed to load section ${id} from ${path}:`, error)
    return {
      id,
      title: 'Content Unavailable',
      html: '<p>Failed to load content.</p>',
      meta: {},
    }
  }
}

function parseHtmlDocument(html: string): Document | null {
  if (!html) {
    return null
  }

  try {
    const parser = new DOMParser()
    return parser.parseFromString(html, 'text/html')
  } catch (error) {
    console.warn('Failed to parse HTML content for homepage section', error)
    return null
  }
}

function extractHeroContent(section: MarkdownSection): {
  heading: string
  paragraphs: string[]
  highlights: ParsedHighlight[]
} {
  const doc = parseHtmlDocument(section.html)
  const paragraphs = doc
    ? Array.from(doc.querySelectorAll('p'))
        .map((paragraph) => paragraph.innerHTML.trim())
        .filter((content) => content.length > 0)
    : []

  const highlights: ParsedHighlight[] = doc
    ? Array.from(doc.querySelectorAll('li'))
        .map((item) => ({ html: item.innerHTML.trim() }))
        .filter((item) => item.html.length > 0)
    : []

  const fallbackHeading = doc?.querySelector('h1, h2')?.textContent?.trim()

  return {
    heading: section.title || fallbackHeading || '',
    paragraphs,
    highlights,
  }
}

function extractProductCards(section: MarkdownSection): ProductCard[] {
  const doc = parseHtmlDocument(section.html)
  if (!doc) {
    return []
  }

  return Array.from(doc.querySelectorAll('h3'))
    .map((heading) => {
      const fragments: string[] = []
      let sibling: ChildNode | null = heading.nextSibling

      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && (sibling as Element).tagName === 'H3') {
          break
        }

        if (sibling.nodeType === Node.ELEMENT_NODE) {
          fragments.push((sibling as Element).outerHTML)
        } else if (sibling.nodeType === Node.TEXT_NODE) {
          const textContent = sibling.textContent?.trim()
          if (textContent) {
            fragments.push(textContent)
          }
        }

        sibling = sibling.nextSibling
      }

      return {
        title: heading.textContent?.trim() ?? '',
        bodyHtml: fragments.join('').trim(),
      }
    })
    .filter((card) => card.title.length > 0 || card.bodyHtml.length > 0)
}

function extractListHighlights(html: string): ParsedHighlight[] {
  const doc = parseHtmlDocument(html)
  if (!doc) {
    return []
  }

  return Array.from(doc.querySelectorAll('li'))
    .map((item) => ({ html: item.innerHTML.trim() }))
    .filter((item) => item.html.length > 0)
}

export const handler: Handlers<HomePageData, FreshState> = {
  async GET(req, ctx) {
    // Check if CMS experience is enabled
    const cmsEnabled = isFeatureEnabled('cmsExperience', '/homepage/dynamic')

    // Get language from query param or use default
    const url = new URL(req.url)
    const langParam = url.searchParams.get('lang')
    const language: Language = (langParam === 'en' || langParam === 'zh') ? langParam : DEFAULT_LANGUAGE

    const sectionPaths = SECTION_PATHS[language]

    // Load all markdown sections in parallel
    const [operations, productSpotlight, news, support, community, resources] = await Promise.all([
      loadMarkdownSection(sectionPaths.operations, 'operations'),
      loadMarkdownSection(sectionPaths.productSpotlight, 'productSpotlight'),
      loadMarkdownSection(sectionPaths.news, 'news'),
      loadMarkdownSection(sectionPaths.support, 'support'),
      loadMarkdownSection(sectionPaths.community, 'community'),
      loadMarkdownSection(sectionPaths.resources, 'resources'),
    ])

    return ctx.render({
      language,
      sections: {
        operations,
        productSpotlight,
        news,
        support,
        community,
        resources,
      },
      cmsEnabled,
      user: ctx.state.user || null,
    })
  },
}

export default function HomePage({ data }: PageProps<HomePageData>) {
  const { sections, language, cmsEnabled, user } = data

  const navItems = [
    { label: language === 'zh' ? '文档' : 'Docs', href: '/docs' },
    { label: language === 'zh' ? '下载' : 'Download', href: '/download' },
    { label: language === 'zh' ? '演示' : 'Demo', href: '/demo' },
  ]

  const heroContent = extractHeroContent(sections.operations)
  const productCards = extractProductCards(sections.productSpotlight)
  const newsHighlights = extractListHighlights(sections.news.html)
  const supportHighlights = extractListHighlights(sections.support.html)
  const communityHighlights = extractListHighlights(sections.community.html)
  const resourcesHighlights = extractListHighlights(sections.resources.html)
  const operationsUpdated =
    typeof sections.operations.meta.updated === 'string' ? sections.operations.meta.updated : null
  const shouldFallbackHero = heroContent.paragraphs.length === 0 && heroContent.highlights.length === 0
  const primaryCtaLabel = language === 'zh' ? '立即体验' : 'Explore Demo'
  const secondaryCtaLabel = language === 'zh' ? '下载发布包' : 'Download Suite'

  return (
    <>
      <Head>
        <title>云原生套件 - CloudNative Suite</title>
        <meta
          name="description"
          content="构建一体化的云原生工具集，融合基础设施即代码（IaC）、GitOps 理念与可观测体系"
        />
      </Head>

      {/* Navbar */}
      <nav class="fixed top-0 left-0 right-0 z-50 border-b border-white/20 bg-gradient-to-r from-brand-navy via-brand to-brand-navy text-white shadow-lg">
        <div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div class="flex items-center gap-8">
            <a href="/" class="text-lg font-semibold tracking-wide">
              CloudNative Suite
            </a>
            <div class="hidden md:flex items-center gap-6 text-sm font-medium text-white/80">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  class="transition hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div class="hidden md:flex items-center gap-4 text-sm">
            <SearchDialog language={language} />
            <a
              href={language === 'zh' ? '/?lang=en' : '/?lang=zh'}
              class="rounded-full border border-white/30 px-3 py-1 text-white/80 transition hover:border-white hover:text-white"
            >
              {language === 'zh' ? 'English' : '中文'}
            </a>
            {user ? (
              <AccountDropdown user={user} language={language} />
            ) : (
              <div class="flex items-center gap-3">
                <a
                  href="/login"
                  class="text-white/80 transition hover:text-white"
                >
                  {language === 'zh' ? '登录' : 'Login'}
                </a>
                <a
                  href="/register"
                  class="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  {language === 'zh' ? '注册' : 'Register'}
                </a>
              </div>
            )}
          </div>

          <div class="flex items-center gap-2 md:hidden">
            <SearchDialog language={language} />
            <MobileMenu language={language} items={navItems} />
          </div>
        </div>
      </nav>

      {/* Main Content with offset for fixed navbar */}
      <main class="relative flex flex-col bg-brand-surface text-brand-heading pt-16">
        {/* Hero Section - Operations */}
        <header class="relative isolate overflow-hidden py-20 sm:py-24">
          <div class="absolute inset-0 bg-gradient-to-b from-brand via-brand/70 to-transparent" aria-hidden />
          <div class="absolute -right-32 top-10 h-64 w-64 rounded-full bg-white/20 blur-3xl" aria-hidden />
          <div class="relative px-4 sm:px-6 lg:px-8">
            <div class="mx-auto w-full max-w-6xl">
              <div class="rounded-3xl border border-white/30 bg-white/10 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.18)] backdrop-blur-lg sm:p-10 lg:p-12">
                {shouldFallbackHero ? (
                  <div
                    class="prose prose-invert max-w-none text-white/90"
                    dangerouslySetInnerHTML={{ __html: sections.operations.html }}
                  />
                ) : (
                  <div class="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-12">
                    <div class="space-y-6 text-white">
                      <div class="flex flex-wrap items-center gap-3">
                        <span class="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em]">
                          CloudNative Suite
                        </span>
                        {operationsUpdated && (
                          <span class="text-xs text-white/80">
                            {language === 'zh'
                              ? `最近更新 · ${operationsUpdated}`
                              : `Last updated · ${operationsUpdated}`}
                          </span>
                        )}
                      </div>
                      {heroContent.heading && (
                        <h1 class="text-[32px] font-bold leading-tight sm:text-[36px]">
                          {heroContent.heading}
                        </h1>
                      )}
                      <div class="space-y-4 text-base text-white/85">
                        {heroContent.paragraphs.map((paragraph, index) => (
                          <p
                            key={index}
                            class="leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: paragraph }}
                          />
                        ))}
                      </div>
                      <div class="flex flex-wrap gap-3 pt-2 text-sm font-semibold">
                        <a
                          href="/demo"
                          class="inline-flex items-center rounded-full bg-white px-5 py-2 text-brand shadow-[0_4px_20px_rgba(51,102,255,0.25)] transition hover:bg-brand-light hover:text-white"
                        >
                          {primaryCtaLabel}
                        </a>
                        <a
                          href="/download"
                          class="inline-flex items-center rounded-full border border-white/40 px-5 py-2 text-white/85 transition hover:border-white hover:text-white"
                        >
                          {secondaryCtaLabel}
                        </a>
                      </div>
                    </div>
                    {heroContent.highlights.length > 0 && (
                      <div class="space-y-4 rounded-2xl border border-white/20 bg-white/10 p-6 text-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
                        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-white/90">
                          {language === 'zh' ? '核心能力' : 'Key Capabilities'}
                        </p>
                        <ul class="space-y-3 text-sm">
                          {heroContent.highlights.map((item, index) => (
                            <li key={index} class="flex items-start gap-3">
                              <span class="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-white" aria-hidden />
                              <span
                                class="leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: item.html }}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Sections */}
        <section class="relative isolate py-20 sm:py-24">
          <div class="absolute inset-x-0 top-0 h-px bg-brand-border/70" aria-hidden />
          <div class="relative px-4 sm:px-6 lg:px-8">
            <div class="mx-auto w-full max-w-6xl">
              <div class="grid gap-12 xl:grid-cols-[minmax(0,2fr)_320px] xl:items-start xl:gap-14">
                <div class="space-y-12">
                  <section class="rounded-3xl border border-brand-border bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
                    {sections.productSpotlight.title && (
                      <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h2 class="text-2xl font-semibold text-brand-navy">
                          {sections.productSpotlight.title}
                        </h2>
                        <a
                          href="/docs"
                          class="inline-flex items-center text-sm font-semibold text-brand transition hover:text-brand-dark"
                        >
                          {language === 'zh' ? '查看全部文档 →' : 'Browse documentation →'}
                        </a>
                      </header>
                    )}
                    {productCards.length > 0 ? (
                      <div class="mt-8 grid gap-6 md:grid-cols-2">
                        {productCards.map((card) => (
                          <div
                            key={card.title}
                            class="flex h-full flex-col gap-4 rounded-2xl border border-brand-border/70 bg-brand-surface/60 p-6"
                          >
                            <h3 class="text-lg font-semibold text-brand-navy">{card.title}</h3>
                            <div
                              class="prose prose-slate max-w-none text-sm text-brand-heading/80 [&_ul]:mt-4 [&_ul]:space-y-2 [&_li]:flex [&_li]:items-start [&_li]:gap-2 [&_li>strong]:text-brand-navy"
                              dangerouslySetInnerHTML={{ __html: card.bodyHtml }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        class="prose prose-slate mt-6 max-w-none text-brand-heading/80"
                        dangerouslySetInnerHTML={{ __html: sections.productSpotlight.html }}
                      />
                    )}
                  </section>

                  <section class="space-y-12">
                    <article class="rounded-3xl border border-brand-border bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                      {sections.news.title && (
                        <h2 class="text-2xl font-semibold text-brand-navy">
                          {sections.news.title}
                        </h2>
                      )}
                      {newsHighlights.length > 0 ? (
                        <ul class="mt-6 space-y-4">
                          {newsHighlights.map((item, index) => (
                            <li
                              key={index}
                              class="rounded-2xl border border-brand-border/70 bg-brand-surface/70 p-5 text-sm text-brand-heading/85 shadow-sm"
                            >
                              <span
                                class="block leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: item.html }}
                              />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div
                          class="prose prose-slate mt-6 max-w-none text-brand-heading/80"
                          dangerouslySetInnerHTML={{ __html: sections.news.html }}
                        />
                      )}
                    </article>

                    <article class="rounded-3xl border border-brand-border bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                      {sections.community.title && (
                        <h2 class="text-2xl font-semibold text-brand-navy">
                          {sections.community.title}
                        </h2>
                      )}
                      {communityHighlights.length > 0 ? (
                        <ul class="mt-6 space-y-4">
                          {communityHighlights.map((item, index) => (
                            <li
                              key={index}
                              class="rounded-2xl border border-brand-border/60 bg-brand-surface/60 p-5 text-sm text-brand-heading/85 shadow-sm"
                            >
                              <span
                                class="block leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: item.html }}
                              />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div
                          class="prose prose-slate mt-6 max-w-none text-brand-heading/80"
                          dangerouslySetInnerHTML={{ __html: sections.community.html }}
                        />
                      )}
                    </article>
                  </section>
                </div>

                <aside class="flex w-full flex-col gap-10">
                  <article class="rounded-3xl border border-brand-border bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.1)]">
                    {sections.support.title && (
                      <h2 class="text-xl font-semibold text-brand-navy">
                        {sections.support.title}
                      </h2>
                    )}
                    {supportHighlights.length > 0 ? (
                      <ul class="mt-5 space-y-3 text-sm text-brand-heading/85">
                        {supportHighlights.map((item, index) => (
                          <li key={index} class="flex items-start gap-3 rounded-2xl border border-brand-border/60 bg-brand-surface/50 p-4 shadow-sm">
                            <span class="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-brand" aria-hidden />
                            <span
                              class="leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: item.html }}
                            />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div
                        class="prose prose-slate mt-5 max-w-none text-brand-heading/80"
                        dangerouslySetInnerHTML={{ __html: sections.support.html }}
                      />
                    )}
                  </article>

                  <article class="rounded-3xl border border-brand-border bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.1)]">
                    {sections.resources.title && (
                      <h2 class="text-xl font-semibold text-brand-navy">
                        {sections.resources.title}
                      </h2>
                    )}
                    {resourcesHighlights.length > 0 ? (
                      <ul class="mt-5 space-y-3 text-sm text-brand-heading/85">
                        {resourcesHighlights.map((item, index) => (
                          <li key={index} class="flex items-start gap-3 rounded-2xl border border-brand-border/60 bg-brand-surface/50 p-4 shadow-sm">
                            <span class="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-brand" aria-hidden />
                            <span
                              class="leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: item.html }}
                            />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div
                        class="prose prose-slate mt-5 max-w-none text-brand-heading/80"
                        dangerouslySetInnerHTML={{ __html: sections.resources.html }}
                      />
                    )}
                  </article>
                </aside>
              </div>
            </div>
          </div>
        </section>

        {/* Debug Info (only in development) */}
        {cmsEnabled && (
          <aside class="mx-auto w-full max-w-6xl px-8 py-4 text-sm text-gray-500">
            <p>
              🚧 CMS Template system is enabled but requires React-to-Preact component migration.
              Currently showing markdown content mode.
            </p>
          </aside>
        )}
      </main>

      {/* Footer */}
      <footer class="bg-brand-navy text-white">
        <div class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-8 py-14">
          <div class="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div class="space-y-3">
              <p class="text-xs font-semibold uppercase tracking-[0.32em] text-brand-light/90">
                CloudNative Suite
              </p>
              <p class="max-w-lg text-sm text-white/70">
                {language === 'zh'
                  ? '企业级云原生团队的统一可观测性、DevOps 和 AI 工作流平台。'
                  : 'Unified observability, DevOps, and AI workflows for enterprise cloud native teams.'
                }
              </p>
              <div class="flex flex-wrap gap-4 text-sm text-white/80">
                <a href="#privacy" class="transition hover:text-brand-light">
                  {language === 'zh' ? '隐私政策' : 'Privacy Policy'}
                </a>
                <a href="#terms" class="transition hover:text-brand-light">
                  {language === 'zh' ? '服务条款' : 'Terms of Service'}
                </a>
                <a href="#contact" class="transition hover:text-brand-light">
                  {language === 'zh' ? '联系我们' : 'Contact Us'}
                </a>
              </div>
            </div>
            <div class="flex flex-col gap-6 text-sm">
              <div class="space-y-2">
                <p class="text-sm font-semibold text-white">GitHub</p>
                <a
                  href="https://github.com/svc-design"
                  class="inline-flex items-center gap-2 text-white/80 transition hover:text-brand-light"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>github.com/svc-design</span>
                </a>
              </div>
              <div class="space-y-2">
                <p class="text-sm font-semibold text-white">
                  {language === 'zh' ? '公众号' : 'WeChat'}
                </p>
                <span class="text-white/80">CloudNative Suite 官方资讯</span>
              </div>
              <div class="space-y-2">
                <p class="text-sm font-semibold text-white">
                  {language === 'zh' ? '联系方式' : 'Contact'}
                </p>
                <a href="mailto:manbuzhe2008@gmail.com" class="text-white/80 transition hover:text-brand-light">
                  manbuzhe2008@gmail.com
                </a>
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2025 CloudNative Suite. All rights reserved.</span>
            <span>
              {language === 'zh'
                ? '在云原生时代充满信心地构建。'
                : 'Build with confidence in the cloud native era.'
              }
            </span>
          </div>
        </div>
      </footer>

      {/* Floating AskAI Button Island */}
      <AskAIButton language={language} />
    </>
  )
}
