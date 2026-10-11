// PreToolUse hook: refuses edits to vendored or generated files, naming the command that owns them.
import { readFileSync } from 'node:fs'

const OWNERS = [
  [/(^|\/)design\/source\//, 'design/source/ is vendored m3l-design: re-run bin/sync-design.sh vX.Y.Z from an m3l-design checkout, and keep local changes in design/local/'],
  [/(^|\/)design\/tokens\.css$/, 'design/tokens.css is generated: edit design/source/dtcg/ upstream, then run node scripts/build-design-tokens.mjs'],
  [/(^|\/)\.claude-plugin\/types\//, '.claude-plugin/types/ is written by the engine when the mod is installed from this folder'],
]

let path = ''
try {
  path = JSON.parse(readFileSync(0, 'utf8')).tool_input?.file_path ?? ''
} catch {
  process.exit(0)
}

const hit = OWNERS.find(([pattern]) => pattern.test(path))
if (hit) {
  console.error(`Blocked: ${hit[1]}.`)
  process.exit(2)
}
