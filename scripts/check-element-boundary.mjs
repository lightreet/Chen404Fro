import { readFile } from 'node:fs/promises'
import { resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = resolve(__dirname, '..')
const srcRoot = resolve(projectRoot, 'src')

const allowedImportPrefixes = [
  'src/components/ui/',
  'src/lib/feedback/',
  'src/compat/',
]

const allowedElementRuntimeFiles = new Set([
  'src/utils/message.ts',
  'src/utils/validation.ts',
])

const violations = []

async function collectFiles(dir, result = []) {
  const { readdir } = await import('node:fs/promises')
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      await collectFiles(fullPath, result)
      continue
    }
    if (!/\.(ts|vue)$/.test(entry.name)) continue
    result.push(fullPath)
  }
  return result
}

function isAllowed(relativePath) {
  if (allowedElementRuntimeFiles.has(relativePath)) return true
  return allowedImportPrefixes.some((prefix) => relativePath.startsWith(prefix))
}

function checkContent(relativePath, content) {
  const importPattern = /from\s+['"](@element-plus\/icons-vue|element-plus)['"]/g
  let matched = false
  for (const match of content.matchAll(importPattern)) {
    matched = true
    if (!isAllowed(relativePath)) {
      violations.push(`${relativePath}: direct import ${match[1]}`)
    }
  }

  if (!matched) return
}

const files = await collectFiles(srcRoot)
for (const file of files) {
  const relativePath = relative(projectRoot, file).replace(/\\/g, '/')
  const content = await readFile(file, 'utf-8')
  checkContent(relativePath, content)
}

if (violations.length) {
  console.error('Element Plus boundary violations found:')
  for (const violation of violations) {
    console.error(`- ${violation}`)
  }
  process.exit(1)
}

console.log('element-boundary-ok')
