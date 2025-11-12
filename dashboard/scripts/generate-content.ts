import { promises as fs } from 'fs'
import path from 'path'
import yaml from 'js-yaml'

type Language = 'zh' | 'en'

type HeroContent = {
  eyebrow: string
  title: string
  tagline?: string
  description: string
  focusAreas?: string[]
  ctaLabel?: string
  products?: Array<{
    label: string
    headline: string
    description: string
    href: string
  }>
}

const CONTENT_ROOT = path.join(process.cwd(), 'src', 'content')
const OUTPUT_ROOT = path.join(process.cwd(), 'src', 'data', 'content')

function parseFrontMatter(raw: string): { metadata: Record<string, any> } {
  const frontMatterMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!frontMatterMatch) {
    return { metadata: {} }
  }

  const [, frontMatter] = frontMatterMatch
  try {
    const metadata = yaml.load(frontMatter) as Record<string, any>
    return { metadata: metadata || {} }
  } catch (error) {
    console.error('Failed to parse YAML frontmatter:', error)
    return { metadata: {} }
  }
}

async function generateHomepageContent() {
  const languages: Language[] = ['zh', 'en']
  const content: Record<Language, HeroContent> = {} as any

  for (const lang of languages) {
    try {
      const filePath = path.join(CONTENT_ROOT, 'homepage', lang, 'hero.md')
      const raw = await fs.readFile(filePath, 'utf-8')
      const { metadata } = parseFrontMatter(raw)
      content[lang] = metadata as HeroContent
    } catch (error) {
      console.error(`Failed to read homepage content for ${lang}:`, error)
    }
  }

  return content
}

async function generateProductContent(product: 'xstream' | 'xcloudflow' | 'xscopehub') {
  const languages: Language[] = ['zh', 'en']
  const content: Record<Language, any> = {} as any

  for (const lang of languages) {
    try {
      const heroPath = path.join(CONTENT_ROOT, 'product', product, lang, 'hero.md')
      const raw = await fs.readFile(heroPath, 'utf-8')
      const { metadata } = parseFrontMatter(raw)
      content[lang] = metadata
    } catch (error) {
      console.error(`Failed to read ${product} content for ${lang}:`, error)
    }
  }

  return content
}

async function main() {
  // Create output directory
  await fs.mkdir(OUTPUT_ROOT, { recursive: true })

  // Generate homepage content
  console.log('Generating homepage content...')
  const homepageContent = await generateHomepageContent()
  await fs.writeFile(
    path.join(OUTPUT_ROOT, 'homepage.json'),
    JSON.stringify(homepageContent, null, 2)
  )

  // Generate product content
  const products = ['xstream', 'xcloudflow', 'xscopehub'] as const
  for (const product of products) {
    console.log(`Generating ${product} content...`)
    const productContent = await generateProductContent(product)
    await fs.writeFile(
      path.join(OUTPUT_ROOT, `${product}.json`),
      JSON.stringify(productContent, null, 2)
    )
  }

  console.log('Content generation complete!')
}

main().catch((error) => {
  console.error('Content generation failed:', error)
  process.exit(1)
})
