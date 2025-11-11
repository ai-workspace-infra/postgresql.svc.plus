import { getSidebarSections } from '@cms/content'

import SidebarCard from './SidebarCard'

export default async function Sidebar() {
  const sections = await getSidebarSections()

  if (!sections.length) {
    return null
  }

  return (
    <aside className="w-full space-y-6 rounded-2xl border border-brand-border bg-white p-6 text-brand-heading shadow-[0_4px_20px_rgba(0,0,0,0.04)] lg:sticky lg:top-0 lg:h-fit lg:w-[360px]">
      {sections.map((section) => (
        <SidebarCard key={section.slug} section={section} />
      ))}
    </aside>
  )
}
