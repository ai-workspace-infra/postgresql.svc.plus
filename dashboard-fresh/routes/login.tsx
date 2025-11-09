/**
 * Login Page - Fresh + Deno
 *
 * User authentication page with MFA support
 */

import { Head } from '$fresh/runtime.ts'
import { Handlers, PageProps } from '$fresh/server.ts'
import { FreshState } from '@/middleware.ts'
import LoginForm from '@/islands/LoginForm.tsx'
import { AuthLayout } from '@/components/auth/AuthLayout.tsx'

type Language = 'zh' | 'en'

interface LoginPageData {
  language: Language
  user: { username?: string; email?: string } | null
  errorParam: string | null
  registeredParam: string | null
  setupMfaParam: string | null
}

export const handler: Handlers<LoginPageData, FreshState> = {
  async GET(req, ctx) {
    // Get language from query param
    const url = new URL(req.url)
    const langParam = url.searchParams.get('lang')
    const language: Language = (langParam === 'en' || langParam === 'zh') ? langParam : 'zh'

    // Get query params for alerts
    const errorParam = url.searchParams.get('error')
    const registeredParam = url.searchParams.get('registered')
    const setupMfaParam = url.searchParams.get('setupMfa')

    return ctx.render({
      language,
      user: ctx.state.user || null,
      errorParam,
      registeredParam,
      setupMfaParam,
    })
  },
}

export default function LoginPage({ data }: PageProps<LoginPageData>) {
  const { language, user, errorParam, registeredParam, setupMfaParam } = data

  // Handle login success - redirect to panel
  const handleLoginSuccess = () => {
    setTimeout(() => {
      globalThis.location.href = '/panel'
    }, 500)
  }

  const t = {
    zh: {
      title: '登录到您的账户',
      pageTitle: '登录 - Cloud-Neutral',
      badge: '欢迎回来',
      description: '输入您的邮箱和密码继续',
      registerPrompt: '还没有账户？',
      registerLink: '立即注册',
      registered: '注册成功！请登录以继续',
      setupMfaRequired: '需要设置双因素认证后才能继续',
      bottomNote: '登录即表示您同意我们的服务条款和隐私政策',
      errorMessages: {
        invalid_credentials: '用户名或密码错误',
        user_not_found: '用户不存在',
        missing_credentials: '请输入完整的登录信息',
        credentials_in_query: '请不要在 URL 中传递敏感信息',
        invalid_request: '无效的请求',
        generic_error: '登录失败，请稍后重试',
      },
    },
    en: {
      title: 'Sign in to your account',
      pageTitle: 'Login - Cloud-Neutral',
      badge: 'Welcome Back',
      description: 'Enter your email and password to continue',
      registerPrompt: "Don't have an account?",
      registerLink: 'Sign up',
      registered: 'Registration successful! Please sign in to continue',
      setupMfaRequired: 'Two-factor authentication setup required before you can continue',
      bottomNote: 'By signing in, you agree to our Terms of Service and Privacy Policy',
      errorMessages: {
        invalid_credentials: 'Invalid username or password',
        user_not_found: 'User not found',
        missing_credentials: 'Please enter your credentials',
        credentials_in_query: 'Please do not pass credentials in URL',
        invalid_request: 'Invalid request',
        generic_error: 'Login failed. Please try again',
      },
    },
  }

  const copy = t[language]

  // Derive alert message
  let alert: { type: 'error' | 'success' | 'info'; message: string } | null = null

  if (registeredParam === '1') {
    alert = { type: 'success', message: copy.registered }
  } else if (setupMfaParam === '1') {
    alert = { type: 'info', message: copy.setupMfaRequired }
  } else if (errorParam) {
    const normalizedError = errorParam.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
    const errorMessage =
      copy.errorMessages[normalizedError as keyof typeof copy.errorMessages] ||
      copy.errorMessages.generic_error
    alert = { type: 'error', message: errorMessage }
  }

  return (
    <>
      <Head>
        <title>{copy.pageTitle}</title>
        <meta name="description" content={copy.description} />
        <link rel="stylesheet" href="/styles/globals.css" />
      </Head>

      <AuthLayout
        mode="login"
        badge={copy.badge}
        title={copy.title}
        description={copy.description}
        alert={alert}
        switchAction={{
          text: copy.registerPrompt,
          linkLabel: copy.registerLink,
          href: `/register${language === 'en' ? '?lang=en' : ''}`,
        }}
        bottomNote={copy.bottomNote}
      >
        <LoginForm language={language} initialEmail={user?.email || ''} onSuccess={handleLoginSuccess} />
      </AuthLayout>
    </>
  )
}
