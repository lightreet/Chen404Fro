import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

/** Load a TypeScript unit with explicit dependency fakes, without a browser or backend. */
export function loadTypeScriptModule(file, dependencies = {}, globals = {}) {
  const source = readFileSync(file, 'utf8')
  const module = { exports: {} }
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(compiled, {
    module, exports: module.exports, ...globals,
    require(name) {
      if (name in dependencies) return dependencies[name]
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  return module.exports
}
