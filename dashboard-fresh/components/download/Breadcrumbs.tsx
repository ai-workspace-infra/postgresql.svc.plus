export interface Crumb {
  label: string
  href: string
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="text-sm mb-4">
      <ol className="flex flex-wrap gap-1 items-center">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-1">
            {idx > 0 && <span>/</span>}
            <a href={item.href} className="text-blue-600 hover:underline">
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
