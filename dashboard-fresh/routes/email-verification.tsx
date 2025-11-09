/**
 * Email Verification Page - Fresh + Deno
 *
 * Email verification page for user registration
 */

import { Head } from '$fresh/runtime.ts'
import { Handlers, PageProps } from '$fresh/server.ts'
import { FreshState } from '@/middleware.ts'

// Import Islands
import EmailVerificationForm from '@/islands/EmailVerificationForm.tsx'

interface EmailVerificationData {
  email: string
  status: string | null
  error: string | null
  language: 'zh' | 'en'
}

export const handler: Handlers<EmailVerificationData, FreshState> = {
  async GET(req, ctx) {
    const url = new URL(req.url)
    const searchParams = url.searchParams

    // Try to get email from various query parameters
    const emailKeys = ['email', 'address', 'identifier', 'account']
    let email = ''
    for (const key of emailKeys) {
      const value = searchParams.get(key)
      if (value && value.trim().length > 0) {
        email = value.trim().toLowerCase()
        break
      }
    }

    const status = searchParams.get('status')
    const error = searchParams.get('error')
    const language = 'zh' // TODO: Get from cookie or state

    return ctx.render({
      email,
      status,
      error,
      language,
    })
  },
}

export default function EmailVerificationPage({ data }: PageProps<EmailVerificationData>) {
  const { email, status, error, language } = data

  const title = language === 'zh' ? '验证邮箱' : 'Verify Email'

  return (
    <>
      <Head>
        <title>{title} - Cloud-Neutral</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <EmailVerificationForm
        email={email}
        status={status}
        error={error}
        language={language}
      />
    </>
  )
}
