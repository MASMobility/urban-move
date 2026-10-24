#!/usr/bin/env node
/**
 * Validates backend/functions.json and keeps the generated tables of
 * backend/README.md up to date.
 *
 *   node .claude/skills/functions-registry/scripts/functions.mjs check
 *   node .claude/skills/functions-registry/scripts/functions.mjs sync
 *
 * `check` writes nothing and exits with code 1 if something is wrong or out of
 * date (meant for CI). `sync` regenerates the README blocks and only writes if
 * the registry is valid. No dependencies: Node only.
 *
 * Options: --root <dir>  repository root (defaults to the one containing this script).
 */
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve, dirname, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROLES = ['user', 'maintenance', 'admin']
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const TRIGGERS = ['http', 'authorizer', 'sqs', 'eventbridge', 'schedule', 'dynamodb-stream', 's3']
const STATUSES = ['planned', 'implemented']
const USES_KINDS = ['dynamodb', 's3', 'secret', 'sqs', 'cloudwatch']
const ACCESS = ['read', 'write', 'readwrite']
const FUNCTION_KEYS = [
  'name', 'service', 'status', 'description', 'entry', 'handler', 'trigger', 'auth',
  'uses', 'publishes', 'consumes', 'memoryMb', 'timeoutSeconds', 'reservedConcurrency',
]
const TRIGGER_KEYS = {
  http: ['type', 'method', 'path'],
  authorizer: ['type'],
  sqs: ['type', 'queue'],
  eventbridge: ['type'],
  schedule: ['type', 'expression'],
  'dynamodb-stream': ['type', 'table'],
  s3: ['type', 'bucket', 'prefix'],
}

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
const EVENT = /^[A-Z][A-Za-z0-9]+$/
const HANDLER = /^([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*)\.([A-Z][A-Za-z0-9_]*)::([a-zA-Z_][A-Za-z0-9_]*)$/
const ENTRY = /^([a-z0-9-]+)\/src\/main\/java\/(.+)\/([A-Z][A-Za-z0-9_]*)\.java$/
const SCHEDULE = /^(rate\(\d+ (minute|minutes|hour|hours|day|days)\)|cron\(.+\))$/
const SKIP_DIRS = new Set(['node_modules', 'target', 'build', 'dist', '.git', '.terraform'])

export const REGISTRY = 'backend/functions.json'
export const README = 'backend/README.md'

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isStringArray = (v) => Array.isArray(v) && v.every((s) => typeof s === 'string')

/** Validates the registry. `handlerFiles` are the *Handler.java files found in backend/ (relative paths, with "/"). */
export function validate(registry, { backendDir, handlerFiles = [] }) {
  const errors = []
  const warnings = []

  if (!isObject(registry) || !Array.isArray(registry.functions)) {
    return { errors: ['functions.json must be an object with a "functions" array.'], warnings }
  }

  const names = new Map()
  const routes = new Map()
  const entries = new Map()
  const published = new Set()

  registry.functions.forEach((fn, index) => {
    const label = isObject(fn) && typeof fn.name === 'string' ? fn.name : `#${index}`
    const bad = (message) => errors.push(`${label}: ${message}`)
    if (!isObject(fn)) return bad('every function must be an object.')

    for (const key of Object.keys(fn)) {
      if (!FUNCTION_KEYS.includes(key)) bad(`unknown field "${key}" (typo?).`)
    }

    // Identity
    if (typeof fn.name !== 'string' || !KEBAB.test(fn.name) || fn.name.length > 64) {
      bad('"name" must be kebab-case and at most 64 characters.')
    } else if (names.has(fn.name)) {
      bad(`duplicate name (also at #${names.get(fn.name)}).`)
    } else {
      names.set(fn.name, index)
    }
    if (typeof fn.service !== 'string' || !KEBAB.test(fn.service)) {
      bad('"service" must be kebab-case (the microservice that owns the function).')
    } else if (typeof fn.name === 'string' && !fn.name.startsWith(`${fn.service}-`)) {
      bad(`"name" must start with "${fn.service}-".`)
    }
    if (fn.status !== undefined && !STATUSES.includes(fn.status)) bad(`"status" must be: ${STATUSES.join(' | ')}.`)
    const planned = fn.status === 'planned'
    if (typeof fn.description !== 'string' || fn.description.trim() === '') {
      bad('"description" is required: it appears in the README tables.')
    }

    // Code
    if (typeof fn.entry !== 'string' || !ENTRY.test(fn.entry)) {
      bad('"entry" must be <service>/src/main/java/<package>/<Class>.java, relative to backend/.')
    } else {
      const [, module, pkgPath, cls] = fn.entry.match(ENTRY)
      if (module !== fn.service) bad(`"entry" must be in the module "${fn.service}/", it is in "${module}/".`)
      if (!cls.endsWith('Handler')) bad(`class "${cls}" must end in "Handler" (that is how unregistered handlers are detected).`)
      const present = existsSync(join(backendDir, fn.entry))
      if (!planned && !present) bad(`"entry" does not exist: backend/${fn.entry} (if it is not written yet, mark the function with "status": "planned").`)
      if (planned && present) warnings.push(`${label}: backend/${fn.entry} already exists; mark it as "implemented".`)
      if (entries.has(fn.entry)) bad(`the same "entry" is already used by ${entries.get(fn.entry)}: one function per handler.`)
      else entries.set(fn.entry, label)

      const parsed = typeof fn.handler === 'string' ? fn.handler.match(HANDLER) : null
      if (!parsed) {
        bad('"handler" must be package.Class::method.')
      } else if (parsed[1].replaceAll('.', '/') !== pkgPath || parsed[2] !== cls) {
        bad(`"handler" (${fn.handler}) does not match "entry" (${fn.entry}).`)
      }
    }

    // Trigger
    const trigger = fn.trigger
    if (!isObject(trigger) || !TRIGGERS.includes(trigger.type)) {
      bad(`"trigger.type" must be one of: ${TRIGGERS.join(', ')}.`)
    } else {
      for (const key of Object.keys(trigger)) {
        if (!TRIGGER_KEYS[trigger.type].includes(key)) bad(`"trigger.${key}" does not apply to a ${trigger.type} trigger.`)
      }
      validateTrigger(trigger, bad)
      if (trigger.type === 'http' && METHODS.includes(trigger.method) && typeof trigger.path === 'string') {
        const route = `${trigger.method} ${trigger.path}`
        if (routes.has(route)) bad(`the route ${route} is already served by ${routes.get(route)}.`)
        else routes.set(route, label)
      }
    }

    // Authorization: HTTP only
    const isHttp = trigger?.type === 'http'
    if (isHttp) {
      if (!isStringArray(fn.auth) || fn.auth.length === 0) {
        bad(`"auth" is required for HTTP: a list of ${ROLES.join('/')} or ["public"].`)
      } else if (fn.auth.some((r) => ![...ROLES, 'public'].includes(r))) {
        bad(`"auth" only accepts: ${[...ROLES, 'public'].join(', ')}.`)
      } else if (fn.auth.includes('public') && fn.auth.length > 1) {
        bad('"public" cannot be combined with roles.')
      }
    } else if (fn.auth !== undefined) {
      bad('"auth" only applies to HTTP functions.')
    }

    // Events
    const eventDriven = trigger?.type === 'sqs' || trigger?.type === 'eventbridge'
    for (const key of ['publishes', 'consumes']) {
      if (fn[key] === undefined) continue
      if (!isStringArray(fn[key]) || fn[key].some((e) => !EVENT.test(e))) bad(`"${key}" must be a list of PascalCase event names.`)
    }
    if (eventDriven && (!Array.isArray(fn.consumes) || fn.consumes.length === 0)) {
      bad(`a ${trigger.type} trigger needs "consumes" with the events it handles.`)
    }
    if (!eventDriven && fn.consumes !== undefined && trigger) {
      bad('"consumes" only applies to sqs or eventbridge triggers.')
    }
    if (Array.isArray(fn.publishes)) fn.publishes.forEach((e) => published.add(e))

    // Permissions
    if (fn.uses !== undefined) {
      if (!Array.isArray(fn.uses)) bad('"uses" must be a list.')
      else fn.uses.forEach((use, i) => {
        if (!isObject(use) || !USES_KINDS.includes(use.kind) || typeof use.name !== 'string' || !KEBAB.test(use.name) || !ACCESS.includes(use.access)) {
          bad(`uses[${i}] must be { kind: ${USES_KINDS.join('|')}, name: kebab-case, access: ${ACCESS.join('|')} }.`)
        }
      })
    }

    // Sizing
    optionalInt(fn, 'memoryMb', 128, 10240, bad)
    optionalInt(fn, 'timeoutSeconds', 1, 900, bad)
    optionalInt(fn, 'reservedConcurrency', 0, 1000, bad)
  })

  // Traceability: a consumer without a producer is almost always a typo.
  for (const fn of registry.functions) {
    for (const event of Array.isArray(fn?.consumes) ? fn.consumes : []) {
      if (!published.has(event)) warnings.push(`${fn.name}: consumes ${event}, but no function publishes it.`)
    }
  }

  // The registry must be complete: every *Handler.java is registered.
  const registered = new Set(entries.keys())
  for (const file of handlerFiles) {
    if (!registered.has(file)) errors.push(`unregistered handler: backend/${file} (add it to functions.json, or rename it if it is not a handler).`)
  }

  return { errors, warnings }
}

function validateTrigger(trigger, bad) {
  switch (trigger.type) {
    case 'http':
      if (!METHODS.includes(trigger.method)) bad(`"trigger.method" must be one of: ${METHODS.join(', ')}.`)
      if (typeof trigger.path !== 'string' || !/^\/[A-Za-z0-9\-_/{}.]*$/.test(trigger.path)) bad('"trigger.path" must start with "/" (parameters like {id}).')
      break
    case 'sqs':
      if (typeof trigger.queue !== 'string' || !KEBAB.test(trigger.queue)) bad('"trigger.queue" must be kebab-case.')
      break
    case 'schedule':
      if (typeof trigger.expression !== 'string' || !SCHEDULE.test(trigger.expression)) bad('"trigger.expression" must be rate(...) or cron(...).')
      break
    case 'dynamodb-stream':
      if (typeof trigger.table !== 'string' || !KEBAB.test(trigger.table)) bad('"trigger.table" must be kebab-case.')
      break
    case 's3':
      if (typeof trigger.bucket !== 'string' || !KEBAB.test(trigger.bucket)) bad('"trigger.bucket" must be kebab-case.')
      if (trigger.prefix !== undefined && typeof trigger.prefix !== 'string') bad('"trigger.prefix" must be text.')
      break
  }
}

function optionalInt(fn, key, min, max, bad) {
  if (fn[key] === undefined) return
  if (!Number.isInteger(fn[key]) || fn[key] < min || fn[key] > max) bad(`"${key}" must be an integer between ${min} and ${max}.`)
}

// --- Generated README blocks -------------------------------------------

const EMPTY = '_None yet._'
const KIND = { dynamodb: 'DynamoDB', s3: 'S3', secret: 'Secret', sqs: 'SQS', cloudwatch: 'CloudWatch' }
const STATUS_LABEL = { planned: 'planned', implemented: 'implemented' }
const statusOf = (f) => STATUS_LABEL[f.status ?? 'implemented']
const ACCESS_LABEL = { read: 'read', write: 'write', readwrite: 'read and write' }

const cell = (text) => String(text).replaceAll('|', '\\|')
const code = (text) => `\`${text}\``
const list = (items) => (items?.length ? items.map(code).join(', ') : '—')
const table = (header, rows) =>
  rows.length === 0
    ? EMPTY
    : [`| ${header.join(' | ')} |`, `| ${header.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n')

function describeTrigger(t) {
  switch (t.type) {
    case 'authorizer': return 'API Gateway authorizer'
    case 'sqs': return `SQS ${code(t.queue)}`
    case 'eventbridge': return 'EventBridge'
    case 'schedule': return `Scheduled ${code(t.expression)}`
    case 'dynamodb-stream': return `Stream of ${code(t.table)}`
    case 's3': return `S3 ${code(t.bucket + (t.prefix ? `/${t.prefix}` : ''))}`
    default: return t.type
  }
}

/** The four blocks that `sync` maintains in backend/README.md. */
export function renderBlocks(functions) {
  const http = functions.filter((f) => f.trigger.type === 'http')
  const async = functions.filter((f) => f.trigger.type !== 'http')

  const events = new Map()
  const slot = (name) => events.get(name) ?? events.set(name, { producers: [], consumers: [] }).get(name)
  for (const f of functions) {
    for (const e of f.publishes ?? []) slot(e).producers.push(f.name)
    for (const e of f.consumes ?? []) slot(e).consumers.push(f.name)
  }

  return {
    routes: table(
      ['Method', 'Route', 'Function', 'Service', 'Who', 'Status', 'What it does'],
      http.map((f) => [f.trigger.method, code(f.trigger.path), code(f.name), f.service, f.auth.includes('public') ? 'public' : f.auth.join(', '), statusOf(f), f.description]),
    ),
    triggers: table(
      ['Function', 'Service', 'Triggered by', 'Consumes', 'Publishes', 'Status', 'What it does'],
      async.map((f) => [code(f.name), f.service, describeTrigger(f.trigger), list(f.consumes), list(f.publishes), statusOf(f), f.description]),
    ),
    permissions: table(
      ['Function', 'Data it touches', 'Publishes events'],
      functions.map((f) => [
        code(f.name),
        f.uses?.length ? f.uses.map((u) => `${u.name} (${KIND[u.kind]}: ${ACCESS_LABEL[u.access]})`).join(', ') : '—',
        f.publishes?.length ? 'yes' : 'no',
      ]),
    ),
    events: table(
      ['Event', 'Published by', 'Consumed by'],
      [...events.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, { producers, consumers }]) => [code(name), list(producers), list(consumers)]),
    ),
  }
}

const SECTIONS = [
  ['routes', '### HTTP routes'],
  ['triggers', '### Event-driven and scheduled functions'],
  ['permissions', '### Permissions per function'],
  ['events', '### Events'],
]
const marker = (block, edge) => `<!-- functions:${block}:${edge} -->`
const wrap = (block, body) => `${marker(block, 'start')}\n${body}\n${marker(block, 'end')}`

/** Rewrites the README blocks; if none exists, appends the "Functions" section at the end. */
export function applyBlocks(readme, blocks) {
  const eol = readme.includes('\r\n') ? '\r\n' : '\n'
  let text = readme.replaceAll('\r\n', '\n')
  const present = SECTIONS.filter(([block]) => text.includes(marker(block, 'start')))

  if (present.length === 0) {
    const intro = 'Generated from `functions.json` (`node .claude/skills/functions-registry/scripts/functions.mjs sync`). Do not edit by hand.'
    const body = SECTIONS.map(([block, heading]) => `${heading}\n\n${wrap(block, blocks[block])}`).join('\n\n')
    text = `${text.replace(/\n*$/, '\n')}\n## Functions\n\n${intro}\n\n${body}\n`
  } else if (present.length < SECTIONS.length) {
    const missing = SECTIONS.filter((s) => !present.includes(s)).map(([block]) => block)
    throw new Error(`backend/README.md has incomplete markers (missing: ${missing.join(', ')}). Restore them or delete them all.`)
  } else {
    for (const [block] of SECTIONS) {
      const pattern = new RegExp(`${escapeRegExp(marker(block, 'start'))}[\\s\\S]*?${escapeRegExp(marker(block, 'end'))}`)
      if (!pattern.test(text)) throw new Error(`The closing marker of "${block}" is missing in backend/README.md.`)
      text = text.replace(pattern, () => wrap(block, blocks[block]))
    }
  }
  return text.replaceAll('\n', eol)
}

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// --- File system and CLI ----------------------------------------------

async function findHandlers(dir, base = dir) {
  const found = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...(await findHandlers(full, base)))
    else if (entry.name.endsWith('Handler.java')) {
      const rel = relative(base, full).split(sep).join('/')
      if (rel.includes('/src/main/')) found.push(rel)
    }
  }
  return found
}

async function load(root) {
  const registryPath = join(root, REGISTRY)
  if (!existsSync(registryPath)) throw new Error(`${REGISTRY} does not exist.`)
  let registry
  try {
    registry = JSON.parse(await readFile(registryPath, 'utf8'))
  } catch (error) {
    throw new Error(`${REGISTRY} is not valid JSON: ${error.message}`)
  }
  const backendDir = join(root, 'backend')
  const result = validate(registry, { backendDir, handlerFiles: await findHandlers(backendDir) })
  return { registry, ...result }
}

export async function run(command, root) {
  const { registry, errors, warnings } = await load(root)
  warnings.forEach((w) => console.warn(`AVISO  ${w}`))
  if (errors.length > 0) {
    errors.forEach((e) => console.error(`ERROR  ${e}`))
    console.error(`\n${errors.length} error(s) in ${REGISTRY}. The README was not touched.`)
    return 1
  }

  const readmePath = join(root, README)
  const existing = existsSync(readmePath) ? await readFile(readmePath, 'utf8') : ''
  const current = existing.trim() === '' ? '# backend\n' : existing
  const next = applyBlocks(current, renderBlocks(registry.functions))
  const upToDate = next === existing

  if (command === 'check') {
    if (!upToDate) {
      console.error(`ERROR  ${README} is out of date with ${REGISTRY}. Run: node .claude/skills/functions-registry/scripts/functions.mjs sync`)
      return 1
    }
    console.log(`OK  ${registry.functions.length} valid function(s) and ${README} is up to date.`)
    return 0
  }

  if (!upToDate) await writeFile(readmePath, next)
  console.log(upToDate ? `OK  ${README} was already up to date.` : `OK  ${README} updated (${registry.functions.length} function(s)).`)
  return 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  const command = args[0]
  const rootFlag = args.indexOf('--root')
  const root = resolve(rootFlag >= 0 ? args[rootFlag + 1] : join(dirname(fileURLToPath(import.meta.url)), '../../../..'))

  if (command !== 'check' && command !== 'sync') {
    console.error('Usage: functions.mjs <check|sync> [--root <dir>]')
    process.exit(2)
  }
  try {
    process.exitCode = await run(command, root)
  } catch (error) {
    console.error(`ERROR  ${error.message}`)
    process.exitCode = 1
  }
}
