/**
 * Register Page - Fresh + Deno
 *
 * User registration page with email verification
 */

import { Head } from '$fresh/runtime.ts'
import { Handlers, PageProps } from '$fresh/server.ts'
import { FreshState } from '@/middleware.ts'
import RegisterForm from '@/islands/RegisterForm.tsx'
import { AuthLayout } from '@/components/auth/AuthLayout.tsx'

type Language = 'zh' | 'en'

interface RegisterPageData {
  language: Language
  errorParam: string | null
  successParam: string | null
}

export const handler: Handlers<RegisterPageData, FreshState> = {
  async GET(req, _ctx) {
    const url = new URL(req.url)
    const langParam = url.searchParams.get('lang')
    const language: Language = (langParam === 'en' || langParam === 'zh') ? langParam : 'zh'

    const errorParam = url.searchParams.get('error')
    const successParam = url.searchParams.get('success')

    return _ctx.render({
      language,
      errorParam,
      successParam,
    })
  },
}

export default function RegisterPage({ data }: PageProps<RegisterPageData>) {
  const { language, errorParam, successParam } = data

  const t = {
    zh: {
      title: '创建您的账户',
      pageTitle: '注册 - Cloud-Neutral',
      badge: '开始使用',
      description: '填写信息以创建您的账户',
      loginPrompt: '已有账户？',
      loginLink: '立即登录',
      bottomNote: '注册即表示您同意我们的服务条款和隐私政策',
      uuidNote: '您的账户将使用 UUID 作为唯一标识符，确保安全性和隐私保护。',
      success: '注册成功！',
      errorMessages: {
        missing_fields: '请填写所有必填字段',
        email_and_password_are_required: '请填写所有必填字段',
        password_mismatch: '两次输入的密码不一致',
        user_already_exists: '该邮箱已被注册',
        email_must_be_a_valid_address: '请输入有效的邮箱地址',
        password_must_be_at_least_8_characters: '密码至少需要 8 位字符',
        email_already_exists: '该邮箱已被注册',
        name_already_exists: '该用户名已被使用',
        invalid_email: '请输入有效的邮箱地址',
        password_too_short: '密码至少需要 8 位字符',
        invalid_name: '用户名格式不正确',
        name_required: '请输入用户名',
        credentials_in_query: '请勿在 URL 中传递敏感信息',
        generic_error: '注册失败，请稍后重试',
      },
    },
    en: {
      title: 'Create your account',
      pageTitle: 'Register - Cloud-Neutral',
      badge: 'Get Started',
      description: 'Fill in your details to create an account',
      loginPrompt: 'Already have an account?',
      loginLink: 'Sign in',
      bottomNote: 'By registering, you agree to our Terms of Service and Privacy Policy',
      uuidNote: 'Your account will use a UUID as a unique identifier to ensure security and privacy protection.',
      success: 'Registration successful!',
      errorMessages: {
        missing_fields: 'Please fill in all required fields',
        email_and_password_are_required: 'Please fill in all required fields',
        password_mismatch: 'Passwords do not match',
        user_already_exists: 'This email is already registered',
        email_must_be_a_valid_address: 'Please enter a valid email address',
        password_must_be_at_least_8_characters: 'Password must be at least 8 characters',
        email_already_exists: 'This email is already registered',
        name_already_exists: 'This username is already taken',
        invalid_email: 'Please enter a valid email address',
        password_too_short: 'Password must be at least 8 characters',
        invalid_name: 'Invalid username format',
        name_required: 'Please enter a username',
        credentials_in_query: 'Please do not pass credentials in URL',
        generic_error: 'Registration failed. Please try again',
      },
    },
  }

  const copy = t[language]

  // Derive alert message
  let alert: { type: 'error' | 'success' | 'info'; message: string } | null = null

  if (successParam === '1') {
    alert = { type: 'success', message: copy.success }
  } else if (errorParam) {
    const normalizedError = errorParam.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
    const errorMessage =
      copy.errorMessages[normalizedError as keyof typeof copy.errorMessages] ||
      copy.errorMessages.generic_error
    alert = { type: 'error', message: errorMessage }
  }

  const aboveForm = copy.uuidNote ? (
    <div class="rounded-2xl border border-dashed border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-700">
      {copy.uuidNote}
    </div>
  ) : null

  return (
    <>
      <Head>
        <title>{copy.pageTitle}</title>
        <meta name="description" content={copy.description} />
        <link rel="stylesheet" href="/styles/globals.css" />
      </Head>

      <AuthLayout
        mode="register"
        badge={copy.badge}
        title={copy.title}
        description={copy.description}
        alert={alert}
        aboveForm={aboveForm}
        switchAction={{
          text: copy.loginPrompt,
          linkLabel: copy.loginLink,
          href: `/login${language === 'en' ? '?lang=en' : ''}`,
        }}
        bottomNote={copy.bottomNote}
      >
        <RegisterForm language={language} />
      </AuthLayout>
    </>
  )
}
