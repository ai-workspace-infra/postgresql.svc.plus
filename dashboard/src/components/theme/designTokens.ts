export type PageVariant = 'homepage' | 'product'

type ButtonVariant = 'primary' | 'secondary'

export const designTokens = {
  colors: {
    primary: 'text-white bg-[#3467e9] hover:bg-[#2957cf] focus-visible:outline-[#2957cf]',
    accent: 'text-[#3467e9]',
    accentHover: 'text-[#2957cf]',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-500',
    border: 'border-black/10',
    surface: 'bg-white',
    surfaceAlt: 'bg-[#f6f7f9]',
    background: 'bg-[#f6f7f9]',
    gradient: 'bg-white',
  },
  layout: {
    container: 'max-w-7xl mx-auto px-6 md:px-10',
  },
  spacing: {
    section: {
      homepage: 'py-16 md:py-20',
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
      sm: 'rounded-md',
      md: 'rounded-lg',
      xl: 'rounded-xl',
    },
    shadows: {
      soft: 'shadow-none',
    },
  },
  transitions: {
    homepage: 'transition duration-700',
    product: 'transition duration-300',
  } satisfies Record<PageVariant, string>,
  cards: {
    base: 'border border-black/10 rounded-md md:rounded-lg transition duration-200 bg-white',
  },
  buttons: {
    base: 'inline-flex items-center justify-center font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2957cf]/60',
    palette: {
      primary: 'bg-[#3467e9] text-white hover:bg-[#2957cf]',
      secondary: 'border border-black/10 text-[#2957cf] hover:bg-[#f6f7f9]',
    } satisfies Record<ButtonVariant, string>,
    shape: {
      homepage: 'rounded-md px-6 py-3 text-base',
      product: 'rounded-md px-5 py-3 text-sm',
    } satisfies Record<PageVariant, string>,
  },
}

export type { ButtonVariant }
