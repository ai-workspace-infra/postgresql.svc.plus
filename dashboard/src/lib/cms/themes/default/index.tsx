import type { CmsTheme } from '../../types'

function PassthroughThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

const defaultTheme: CmsTheme = {
  name: 'default',
  htmlAttributes: {
    lang: 'en',
  },
  bodyClassName: 'bg-[var(--color-background)] text-[var(--color-text)]',
  Provider: PassthroughThemeProvider,
}

export default defaultTheme
