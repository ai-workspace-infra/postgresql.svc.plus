export type PageVariant = 'homepage' | 'product'

type ButtonVariant = 'primary' | 'secondary'

export const designTokens = {
  colors: {
    primary: 'text-white bg-brand hover:bg-brand-dark focus-visible:outline-brand-dark',
    accent: 'text-brand',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    border: 'border-border',
    surface: 'bg-white',
    background: 'bg-brand-surface',
    gradient: 'bg-gradient-to-br from-brand-surface/60 via-white to-indigo-50',
  },
  layout: {
    container: 'max-w-7xl mx-auto px-6 md:px-10',
  },
  spacing: {
    section: {
      homepage: 'py-24',
      product: 'py-16',
    } satisfies Record<PageVariant, string>,
  },
  hero: {
    heights: {
      homepage: 'min-h-[90vh]',
      product: 'min-h-[60vh]',
    } satisfies Record<PageVariant, string>,
    background: {
      homepage: 'bg-gradient-to-br from-brand-surface/60 via-white to-white',
      product: 'bg-gradient-to-b from-brand-surface/70 to-white',
    } satisfies Record<PageVariant, string>,
  },
  effects: {
    radii: {
      xl: 'rounded-2xl',
    },
    shadows: {
      soft: 'shadow-soft',
    },
  },
  transitions: {
    homepage: 'transition duration-700',
    product: 'transition duration-300',
  } satisfies Record<PageVariant, string>,
  cards: {
    base: 'border border-border rounded-2xl shadow-soft hover:shadow-lg transition-shadow duration-300 bg-white',
  },
  buttons: {
    base: 'inline-flex items-center justify-center font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand/60',
    palette: {
      primary: 'bg-brand text-white shadow-soft hover:bg-brand-dark',
      secondary: 'border border-border text-brand-dark hover:bg-brand-surface/60',
    } satisfies Record<ButtonVariant, string>,
    shape: {
      homepage: 'rounded-full px-8 py-3 text-base',
      product: 'rounded-lg px-5 py-3 text-sm',
    } satisfies Record<PageVariant, string>,
  },
}

export type { ButtonVariant }
