export const dynamic = 'error'

import { redirect } from 'next/navigation'

import { resolveExtensionRouteComponent } from '@extensions/loader'

export default async function AgentPage() {
  try {
    const Component = await resolveExtensionRouteComponent('/panel/agent')
    return <Component />
  } catch (error) {
    if (error instanceof Error && error.message.includes('disabled')) {
      redirect('/panel')
    }
    throw error
  }
}
