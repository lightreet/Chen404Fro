import { readFile, readdir } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = resolve(__dirname, '..')
const componentRoots = [
  resolve(projectRoot, 'src/components/ui'),
  resolve(projectRoot, 'src/components/app'),
]
const foundationFiles = [
  resolve(projectRoot, 'src/assets/styles/global.scss'),
  resolve(projectRoot, 'src/assets/styles/element-theme.scss'),
]
const standardBreakpoints = new Set([640, 768, 1024, 1280])
const violations = []

async function collectFiles(dir, result = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      await collectFiles(fullPath, result)
      continue
    }
    if (!/\.(vue|scss|css)$/.test(entry.name)) continue
    result.push(fullPath)
  }
  return result
}

function projectPath(file) {
  return relative(projectRoot, file).replace(/\\/g, '/')
}

function styleContent(file, content) {
  if (!file.endsWith('.vue')) return content
  return [...content.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((match) => match[1])
    .join('\n')
}

function reportMatches(relativePath, content, pattern, message) {
  for (const match of content.matchAll(pattern)) {
    const line = content.slice(0, match.index).split(/\r?\n/).length
    violations.push(`${relativePath}:${line}: ${message} (${match[0]})`)
  }
}

function checkFoundationStyle(relativePath, styles) {
  reportMatches(
    relativePath,
    styles,
    /var\(--(?:primary(?:-[\w-]+)?|bg-[\w-]+|text-[\w-]+|border-(?:color|light|strong)|spacing-[\w-]+|font-(?:sans|mono)|shadow-(?:sm|md|lg)|success|warning|danger|info)\b/g,
    'legacy visual variable is forbidden in design foundations',
  )
  reportMatches(
    relativePath,
    styles,
    /transition\s*:\s*all\b/gi,
    'transition: all is forbidden',
  )
}

function checkOwnedComponent(relativePath, styles) {
  checkFoundationStyle(relativePath, styles)
  reportMatches(
    relativePath,
    styles,
    /#[0-9a-f]{3,8}\b/gi,
    'raw hex color is forbidden in Ui/App styles; add or reuse a semantic token',
  )
  reportMatches(
    relativePath,
    styles,
    /font-size\s*:\s*[0-9.]+px\b/gi,
    'fixed pixel font-size is forbidden in Ui/App styles',
  )
  reportMatches(
    relativePath,
    styles,
    /border-radius\s*:\s*[0-9.]+px\b/gi,
    'fixed pixel border-radius is forbidden in Ui/App styles',
  )

  for (const match of styles.matchAll(/@media\s*\([^)]*(?:min|max)-width\s*:\s*(\d+)px/gi)) {
    const breakpoint = Number(match[1])
    if (!standardBreakpoints.has(breakpoint)) {
      violations.push(
        `${relativePath}: non-standard viewport breakpoint ${breakpoint}px; use 640/768/1024/1280 or document a local content failure`,
      )
    }
  }
}

function extractCssBlock(content, selector) {
  const selectorIndex = content.indexOf(selector)
  if (selectorIndex < 0) return ''
  const openIndex = content.indexOf('{', selectorIndex)
  if (openIndex < 0) return ''

  let depth = 0
  for (let index = openIndex; index < content.length; index += 1) {
    if (content[index] === '{') depth += 1
    if (content[index] === '}') depth -= 1
    if (depth === 0) return content.slice(openIndex + 1, index)
  }
  return ''
}

function readHexVariable(block, name) {
  const match = block.match(new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*(#[0-9a-f]{6})\\s*;`, 'i'))
  return match?.[1]
}

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255)
  const linear = channels.map((channel) => (
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  ))
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2])
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first)
  const secondLuminance = relativeLuminance(second)
  const lighter = Math.max(firstLuminance, secondLuminance)
  const darker = Math.min(firstLuminance, secondLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

function checkContrast(label, foreground, background, minimum = 4.5) {
  if (!foreground || !background) {
    violations.push(`tokens.scss: unable to resolve contrast pair ${label}`)
    return
  }
  const ratio = contrastRatio(foreground, background)
  if (ratio < minimum) {
    violations.push(
      `tokens.scss: ${label} contrast ${ratio.toFixed(2)}:1 is below ${minimum}:1`,
    )
  }
}

const componentFiles = (await Promise.all(componentRoots.map((root) => collectFiles(root)))).flat()
for (const file of componentFiles) {
  const content = await readFile(file, 'utf-8')
  checkOwnedComponent(projectPath(file), styleContent(file, content))
}

for (const file of foundationFiles) {
  const content = await readFile(file, 'utf-8')
  checkFoundationStyle(projectPath(file), styleContent(file, content))
}

const tokenFile = resolve(projectRoot, 'src/assets/styles/tokens.scss')
const tokenContent = await readFile(tokenFile, 'utf-8')
const requiredTokens = [
  '--color-brand-sakura',
  '--color-action-primary',
  '--color-action-solid',
  '--color-focus-ring',
  '--color-text-tertiary',
  '--font-family-reading',
  '--font-size-body',
  '--line-height-reading',
  '--layout-page-max',
  '--layout-reading-shell',
  '--layout-reading-content',
  '--layout-reading-prose',
]
for (const requiredToken of requiredTokens) {
  if (!tokenContent.includes(`${requiredToken}:`)) {
    violations.push(`src/assets/styles/tokens.scss: missing required token ${requiredToken}`)
  }
}

const lightTokens = extractCssBlock(tokenContent, ':root')
const darkTokens = extractCssBlock(tokenContent, '[data-theme="dark"]')
checkContrast(
  'light action solid / on-action',
  readHexVariable(lightTokens, '--color-on-action'),
  readHexVariable(lightTokens, '--color-action-solid'),
)
checkContrast(
  'light tertiary text / surface',
  readHexVariable(lightTokens, '--color-text-tertiary'),
  readHexVariable(lightTokens, '--color-surface'),
)
checkContrast(
  'dark action text / surface',
  readHexVariable(darkTokens, '--color-action-primary'),
  readHexVariable(darkTokens, '--color-surface'),
)
checkContrast(
  'dark tertiary text / surface',
  readHexVariable(darkTokens, '--color-text-tertiary'),
  readHexVariable(darkTokens, '--color-surface'),
)

const articleFile = resolve(projectRoot, 'src/views/Article/ArticleDetail.vue')
const articleContent = await readFile(articleFile, 'utf-8')
if (!articleContent.includes('--article-content-width: var(--layout-reading-content)')) {
  violations.push('src/views/Article/ArticleDetail.vue: article content width must use --layout-reading-content')
}
if (!articleContent.includes('--article-prose-width: var(--layout-reading-prose)')) {
  violations.push('src/views/Article/ArticleDetail.vue: article prose width must use --layout-reading-prose')
}

const defaultLayoutFile = resolve(projectRoot, 'src/layouts/DefaultLayout.vue')
const defaultLayoutContent = await readFile(defaultLayoutFile, 'utf-8')
if (!defaultLayoutContent.includes('max-width: var(--layout-reading-shell)')) {
  violations.push('src/layouts/DefaultLayout.vue: default reading shell must use --layout-reading-shell')
}

const designDoc = await readFile(resolve(projectRoot, 'DESIGN.md'), 'utf-8')
for (const requiredRule of [
  'The Canvas-Content-Prose Rule',
  'Brand color and action color are related but not interchangeable',
  'Reader / Bookshelf',
]) {
  if (!designDoc.includes(requiredRule)) {
    violations.push(`DESIGN.md: missing required design rule "${requiredRule}"`)
  }
}

if (violations.length) {
  console.error('Design boundary violations found:')
  for (const violation of violations) {
    console.error(`- ${violation}`)
  }
  process.exit(1)
}

console.log('design-boundary-ok')
