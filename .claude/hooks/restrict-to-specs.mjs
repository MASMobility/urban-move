#!/usr/bin/env node
/**
 * PreToolUse hook of the planner agent (Claude Code): it may only write inside specs/.
 * OpenCode enforces the same rule with `edit: { "specs/**": "allow" }` in opencode.jsonc.
 * Exit code 2 blocks the tool call and shows the message to the agent.
 */
import { resolve, relative, isAbsolute } from 'node:path'

let input = ''
for await (const chunk of process.stdin) input += chunk

let file
try {
  file = JSON.parse(input).tool_input?.file_path
} catch {
  console.error('restrict-to-specs: could not read the hook input; blocking to be safe.')
  process.exit(2)
}
if (!file) process.exit(0)

const root = resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd())
const rel = relative(root, resolve(root, file))
const inside = rel !== '' && !rel.startsWith('..') && !isAbsolute(rel) && rel.split(/[\\/]/)[0] === 'specs'

if (!inside) {
  console.error(`The planner may only write inside specs/ (tried: ${file}).`)
  process.exit(2)
}
