export const dynamic = 'error'

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { isFeatureEnabled } from '@lib/featureToggles'
import { LoginForm } from './LoginForm'
import LoginContent from './LoginContent'

function LoginPageFallback() {
  return <div className="flex min-h-screen flex-col bg-slate-50" />
}

export default function LoginPage() {
  if (!isFeatureEnabled('globalNavigation', '/login')) {
    notFound()
  }
  // 统一返回：容器包裹表单，兼容两边改动
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginContent>
        <LoginForm />
      </LoginContent>
    </Suspense>
  )
}
