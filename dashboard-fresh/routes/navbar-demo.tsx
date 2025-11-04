/**
 * Navbar Demo Route - Fresh + Deno
 *
 * Demonstrates the fixed Navbar component with proper styling
 */

import { Head } from '$fresh/runtime.ts'
import { PageProps } from '$fresh/server.ts'
import Navbar from '@/islands/Navbar.tsx'

export default function NavbarDemoPage(props: PageProps) {
  const url = new URL(props.url)
  const lang = url.searchParams.get('lang')
  const language: 'zh' | 'en' = (lang === 'en' || lang === 'zh') ? lang : 'zh'

  // Example user data - you can pass null for logged-out state
  const user = {
    username: 'Demo User',
    email: 'demo@cloudnative.com',
    isAdmin: false,
    isOperator: false,
  }

  return (
    <>
      <Head>
        <title>Navbar Demo - CloudNative Suite</title>
        <meta name="description" content="Demonstration of the fixed Fresh Navbar component" />
        <link rel="stylesheet" href="/styles/globals.css" />
      </Head>

      {/* Navbar with fixed styling */}
      <Navbar language={language} user={user} pathname={props.url.pathname} />

      {/* Main content with offset for fixed navbar */}
      <main class="min-h-screen bg-brand-surface pt-24">
        <div class="mx-auto max-w-7xl px-6 py-12 sm:px-8">
          <div class="space-y-8">
            {/* Header */}
            <header class="rounded-3xl border border-brand-border bg-white p-8 shadow-lg">
              <h1 class="text-4xl font-bold text-brand-navy">
                {language === 'zh' ? 'Navbar 修复演示' : 'Navbar Fix Demo'}
              </h1>
              <p class="mt-4 text-lg text-brand-heading/80">
                {language === 'zh'
                  ? '此页面演示了已修复的 Navbar 组件，恢复了原始 Next.js 设计的所有样式和功能。'
                  : 'This page demonstrates the fixed Navbar component, restoring all styling and functionality from the original Next.js design.'}
              </p>
            </header>

            {/* Features Section */}
            <section class="rounded-3xl border border-brand-border bg-white p-8 shadow-lg">
              <h2 class="text-2xl font-semibold text-brand-navy">
                {language === 'zh' ? '修复内容' : 'What Was Fixed'}
              </h2>
              <div class="mt-6 grid gap-6 md:grid-cols-2">
                <div class="space-y-3 rounded-2xl border border-brand-border/70 bg-brand-surface/60 p-6">
                  <h3 class="font-semibold text-brand-navy">
                    {language === 'zh' ? '✅ Navbar 容器样式' : '✅ Navbar Container Styling'}
                  </h3>
                  <ul class="space-y-2 text-sm text-brand-heading/80">
                    <li>• <code>bg-white/85</code> - 白色半透明背景</li>
                    <li>• <code>backdrop-blur</code> - 毛玻璃效果</li>
                    <li>• <code>fixed top-0</code> - 固定在顶部</li>
                    <li>• <code>border-brand-border/60</code> - 品牌色边框</li>
                  </ul>
                </div>

                <div class="space-y-3 rounded-2xl border border-brand-border/70 bg-brand-surface/60 p-6">
                  <h3 class="font-semibold text-brand-navy">
                    {language === 'zh' ? '✅ 品牌标识对比度' : '✅ Branding Contrast'}
                  </h3>
                  <ul class="space-y-2 text-sm text-brand-heading/80">
                    <li>• <code>text-gray-900</code> - Logo 和标题</li>
                    <li>• <code>text-brand-heading</code> - 菜单项</li>
                    <li>• <code>hover:text-brand</code> - 悬停效果</li>
                    <li>• 高对比度确保可读性</li>
                  </ul>
                </div>

                <div class="space-y-3 rounded-2xl border border-brand-border/70 bg-brand-surface/60 p-6">
                  <h3 class="font-semibold text-brand-navy">
                    {language === 'zh' ? '✅ 搜索栏和按钮' : '✅ Search Bar & Buttons'}
                  </h3>
                  <ul class="space-y-2 text-sm text-brand-heading/80">
                    <li>• 圆角搜索框带品牌色聚焦效果</li>
                    <li>• 登录/注册按钮正确对齐</li>
                    <li>• 邮件中心图标</li>
                    <li>• 语言切换器</li>
                  </ul>
                </div>

                <div class="space-y-3 rounded-2xl border border-brand-border/70 bg-brand-surface/60 p-6">
                  <h3 class="font-semibold text-brand-navy">
                    {language === 'zh' ? '✅ 响应式设计' : '✅ Responsive Design'}
                  </h3>
                  <ul class="space-y-2 text-sm text-brand-heading/80">
                    <li>• 移动端汉堡菜单</li>
                    <li>• 平板和桌面端完整导航</li>
                    <li>• 流畅的过渡动画</li>
                    <li>• 下拉菜单交互</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Technical Details */}
            <section class="rounded-3xl border border-brand-border bg-white p-8 shadow-lg">
              <h2 class="text-2xl font-semibold text-brand-navy">
                {language === 'zh' ? '技术细节' : 'Technical Details'}
              </h2>
              <div class="mt-6 space-y-4 text-brand-heading/80">
                <div class="rounded-2xl border border-brand-border/70 bg-brand-surface/60 p-4">
                  <h4 class="font-semibold text-brand-navy">Migration from Next.js to Fresh</h4>
                  <ul class="mt-2 space-y-1 text-sm">
                    <li>• <strong>React → Preact:</strong> Using <code>@preact/signals</code> for state management</li>
                    <li>• <strong>Next.js Link → Standard <code>&lt;a&gt;</code>:</strong> Fresh uses standard HTML elements</li>
                    <li>• <strong>Next.js Image → Standard <code>&lt;img&gt;</code>:</strong> Simplified image handling</li>
                    <li>• <strong>className → class:</strong> Preact uses <code>class</code> attribute</li>
                    <li>• <strong>Islands Architecture:</strong> Client-side interactivity in <code>/islands/Navbar.tsx</code></li>
                  </ul>
                </div>

                <div class="rounded-2xl border border-brand-border/70 bg-brand-surface/60 p-4">
                  <h4 class="font-semibold text-brand-navy">Preserved Features</h4>
                  <ul class="mt-2 space-y-1 text-sm">
                    <li>• 🌍 Internationalization (中文/English)</li>
                    <li>• 👤 User account dropdown with avatar</li>
                    <li>• 🔍 Search functionality</li>
                    <li>• 📧 Mail center access</li>
                    <li>• 🧪 Release channel selector (experimental)</li>
                    <li>• 📱 Mobile-responsive menu</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Test User States */}
            <section class="rounded-3xl border border-brand-border bg-white p-8 shadow-lg">
              <h2 class="text-2xl font-semibold text-brand-navy">
                {language === 'zh' ? '测试不同状态' : 'Test Different States'}
              </h2>
              <div class="mt-6 flex flex-wrap gap-4">
                <a
                  href="/navbar-demo?lang=zh"
                  class="rounded-full border border-brand bg-white px-6 py-3 font-semibold text-brand transition hover:bg-brand hover:text-white"
                >
                  切换到中文
                </a>
                <a
                  href="/navbar-demo?lang=en"
                  class="rounded-full border border-brand bg-white px-6 py-3 font-semibold text-brand transition hover:bg-brand hover:text-white"
                >
                  Switch to English
                </a>
              </div>
              <p class="mt-4 text-sm text-brand-heading/70">
                {language === 'zh'
                  ? '提示：调整浏览器窗口大小以测试响应式行为。点击右上角的账户头像查看下拉菜单。'
                  : 'Tip: Resize your browser window to test responsive behavior. Click the account avatar in the top-right to see the dropdown menu.'}
              </p>
            </section>

            {/* Back to Home */}
            <div class="flex justify-center">
              <a
                href="/"
                class="inline-flex items-center gap-2 rounded-full bg-brand px-8 py-3 font-semibold text-white shadow-[0_4px_20px_rgba(51,102,255,0.25)] transition hover:bg-brand-light"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {language === 'zh' ? '返回首页' : 'Back to Home'}
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer class="border-t border-brand-border bg-white py-8">
        <div class="mx-auto max-w-7xl px-6 text-center text-sm text-brand-heading/70">
          <p>© 2025 CloudNative Suite. {language === 'zh' ? '保留所有权利。' : 'All rights reserved.'}</p>
        </div>
      </footer>
    </>
  )
}
