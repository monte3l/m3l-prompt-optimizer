// Preloaded by scripts/node-tests.mjs (`node --import`). Resolves what the engine normally supplies:
// the mod's `./x.js` imports to their `.ts` sources, `claude-code/testing` to the shim, and `fast-check`
// to the copy pinned in .github/test-tools.
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SHIM = pathToFileURL(join(root, 'scripts/lib/testing-shim.mjs')).href
const FAST_CHECK = join(root, '.github/test-tools/node_modules/fast-check/lib/fast-check.js')

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'claude-code/testing') return { url: SHIM, shortCircuit: true }
    if (specifier === 'fast-check') return next(pathToFileURL(FAST_CHECK).href, context)
    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL) {
      const ts = new URL(specifier.replace(/\.js$/, '.ts'), context.parentURL)
      if (existsSync(fileURLToPath(ts))) return next(ts.href, context)
    }
    return next(specifier, context)
  },
})
