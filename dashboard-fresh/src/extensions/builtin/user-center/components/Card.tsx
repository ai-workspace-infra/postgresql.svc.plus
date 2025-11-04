import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <section
      className={`rounded-[var(--radius-xl)] border border-[color:var(--color-surface-border)] bg-[var(--color-surface-elevated)] p-6 shadow-[var(--shadow-sm)] backdrop-blur transition-colors ${className}`.trim()}
    >
      {children}
    </section>
  )
}
