/**
 * Homepage - Fresh + Deno
 *
 * Main landing page with CMS template or markdown content support
 */

import { Head } from '$fresh/runtime.ts'
import { Handlers, PageProps } from '$fresh/server.ts'
import { FreshState } from '@/middleware.ts'
import { isFeatureEnabled } from '@/lib/featureToggles.ts'
import { renderMarkdownFile, type MarkdownRenderResult } from '@/api/render-markdown.ts'

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
      <nav class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="flex h-16 items-center justify-between">
            <div class="flex items-center">
              <a href="/" class="text-xl font-bold text-gray-900">
                CloudNative Suite
              </a>
              {/* Desktop Navigation */}
              <div class="hidden md:block ml-10">
                <div class="flex items-baseline space-x-4">
                  {navItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      class="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Actions */}
            <div class="hidden md:flex items-center space-x-4">
              {/* Search Dialog Island */}
              <SearchDialog language={language} />

              {/* Language Toggle */}
              <a
                href={language === 'zh' ? '/?lang=en' : '/?lang=zh'}
                class="text-sm text-gray-700 hover:text-gray-900"
              >
                {language === 'zh' ? 'English' : '中文'}
              </a>

              {/* Account Dropdown or Auth Links */}
              {user ? (
                <AccountDropdown user={user} language={language} />
              ) : (
                <>
                  <a
                    href="/login"
                    class="text-sm text-gray-700 hover:text-gray-900"
                  >
                    {language === 'zh' ? '登录' : 'Login'}
                  </a>
                  <a
                    href="/register"
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                  >
                    {language === 'zh' ? '注册' : 'Register'}
                  </a>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div class="flex md:hidden items-center space-x-2">
              {/* Mobile Search */}
              <SearchDialog language={language} />

              {/* Mobile Menu Island */}
              <MobileMenu language={language} items={navItems} />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with offset for fixed navbar */}
      <main class="flex flex-col bg-brand-surface text-brand-heading pt-16">
        {/* Hero Section - Operations */}
        <header class="bg-brand py-16 text-white">
          <div class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8">
            {sections.operations.title && (
              <h1 class="text-[36px] font-bold text-white">
                {sections.operations.title}
              </h1>
            )}
            <div
              class="prose prose-invert prose-headings:text-white prose-strong:text-white text-white/90 max-w-none"
              dangerouslySetInnerHTML={{ __html: sections.operations.html }}
            />
          </div>
        </header>

        {/* Main Content Sections */}
        <section class="mx-auto flex w-full max-w-6xl flex-col gap-12 px-8 py-16">
          {/* Product Spotlight */}
          <article class="rounded-2xl border border-brand-border bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            {sections.productSpotlight.title && (
              <h2 class="text-2xl font-semibold text-brand-navy">
                {sections.productSpotlight.title}
              </h2>
            )}
            <div
              class="prose prose-slate mt-6 max-w-none text-brand-heading/80"
              dangerouslySetInnerHTML={{ __html: sections.productSpotlight.html }}
            />
          </article>

          {/* Grid Layout: News + Sidebar (Support & Resources) */}
          <div class="grid gap-12 lg:grid-cols-[minmax(0,2fr)_360px]">
            {/* News Section */}
            <article class="rounded-2xl border border-brand-border bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              {sections.news.title && (
                <h2 class="text-2xl font-semibold text-brand-navy">
                  {sections.news.title}
                </h2>
              )}
              <div
                class="prose prose-slate mt-6 max-w-none text-brand-heading/80"
                dangerouslySetInnerHTML={{ __html: sections.news.html }}
              />
            </article>

            {/* Sidebar */}
            <div class="flex flex-col gap-12">
              {/* Support Section */}
              <article class="rounded-2xl border border-brand-border bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                {sections.support.title && (
                  <h2 class="text-2xl font-semibold text-brand-navy">
                    {sections.support.title}
                  </h2>
                )}
                <div
                  class="prose prose-slate mt-6 max-w-none text-brand-heading/80"
                  dangerouslySetInnerHTML={{ __html: sections.support.html }}
                />
              </article>

              {/* Resources Section */}
              <article class="rounded-2xl border border-brand-border bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                {sections.resources.title && (
                  <h2 class="text-2xl font-semibold text-brand-navy">
                    {sections.resources.title}
                  </h2>
                )}
                <div
                  class="prose prose-slate mt-6 max-w-none text-brand-heading/80"
                  dangerouslySetInnerHTML={{ __html: sections.resources.html }}
                />
              </article>
            </div>
          </div>

          {/* Community Section */}
          <article class="rounded-2xl border border-brand-border bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            {sections.community.title && (
              <h2 class="text-2xl font-semibold text-brand-navy">
                {sections.community.title}
              </h2>
            )}
            <div
              class="prose prose-slate mt-6 max-w-none text-brand-heading/80"
              dangerouslySetInnerHTML={{ __html: sections.community.html }}
            />
          </article>
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
