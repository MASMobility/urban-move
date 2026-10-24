#!/usr/bin/env node
/**
 * Valida backend/functions.json y mantiene al día las tablas generadas de
 * backend/README.md.
 *
 *   node .claude/skills/functions-registry/scripts/functions.mjs check
 *   node .claude/skills/functions-registry/scripts/functions.mjs sync
 *
 * `check` no escribe nada y sale con código 1 si algo está mal o desfasado
 * (pensado para CI). `sync` regenera los bloques del README y solo escribe si
 * el registro es válido. Sin dependencias: solo Node >= 22.
 *
 * Opciones: --root <dir>  raíz del repositorio (por defecto, la de este script).
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

/** Valida el registro. `handlerFiles` son los *Handler.java que hay en backend/ (rutas relativas, con "/"). */
export function validate(registry, { backendDir, handlerFiles = [] }) {
  const errors = []
  const warnings = []

  if (!isObject(registry) || !Array.isArray(registry.functions)) {
    return { errors: ['functions.json debe ser un objeto con un array "functions".'], warnings }
  }

  const names = new Map()
  const routes = new Map()
  const entries = new Map()
  const published = new Set()

  registry.functions.forEach((fn, index) => {
    const label = isObject(fn) && typeof fn.name === 'string' ? fn.name : `#${index}`
    const bad = (message) => errors.push(`${label}: ${message}`)
    if (!isObject(fn)) return bad('cada función debe ser un objeto.')

    for (const key of Object.keys(fn)) {
      if (!FUNCTION_KEYS.includes(key)) bad(`campo desconocido "${key}" (¿errata?).`)
    }

    // Identidad
    if (typeof fn.name !== 'string' || !KEBAB.test(fn.name) || fn.name.length > 64) {
      bad('"name" debe ser kebab-case y de 64 caracteres como máximo.')
    } else if (names.has(fn.name)) {
      bad(`nombre duplicado (también en #${names.get(fn.name)}).`)
    } else {
      names.set(fn.name, index)
    }
    if (typeof fn.service !== 'string' || !KEBAB.test(fn.service)) {
      bad('"service" debe ser kebab-case (el microservicio dueño de la función).')
    } else if (typeof fn.name === 'string' && !fn.name.startsWith(`${fn.service}-`)) {
      bad(`"name" debe empezar por "${fn.service}-".`)
    }
    if (fn.status !== undefined && !STATUSES.includes(fn.status)) bad(`"status" debe ser: ${STATUSES.join(' | ')}.`)
    const planned = fn.status === 'planned'
    if (typeof fn.description !== 'string' || fn.description.trim() === '') {
      bad('"description" es obligatoria: sale en las tablas del README.')
    }

    // Código
    if (typeof fn.entry !== 'string' || !ENTRY.test(fn.entry)) {
      bad('"entry" debe ser <servicio>/src/main/java/<paquete>/<Clase>.java, relativo a backend/.')
    } else {
      const [, module, pkgPath, cls] = fn.entry.match(ENTRY)
      if (module !== fn.service) bad(`"entry" debe estar en el módulo "${fn.service}/", está en "${module}/".`)
      if (!cls.endsWith('Handler')) bad(`la clase "${cls}" debe acabar en "Handler" (así se detectan los handlers sin registrar).`)
      const present = existsSync(join(backendDir, fn.entry))
      if (!planned && !present) bad(`"entry" no existe: backend/${fn.entry} (si aún no está escrito, marca la función con "status": "planned").`)
      if (planned && present) warnings.push(`${label}: backend/${fn.entry} ya existe; márcala como "implemented".`)
      if (entries.has(fn.entry)) bad(`el mismo "entry" ya lo usa ${entries.get(fn.entry)}: una función por handler.`)
      else entries.set(fn.entry, label)

      const parsed = typeof fn.handler === 'string' ? fn.handler.match(HANDLER) : null
      if (!parsed) {
        bad('"handler" debe ser paquete.Clase::metodo.')
      } else if (parsed[1].replaceAll('.', '/') !== pkgPath || parsed[2] !== cls) {
        bad(`"handler" (${fn.handler}) no corresponde con "entry" (${fn.entry}).`)
      }
    }

    // Disparador
    const trigger = fn.trigger
    if (!isObject(trigger) || !TRIGGERS.includes(trigger.type)) {
      bad(`"trigger.type" debe ser uno de: ${TRIGGERS.join(', ')}.`)
    } else {
      for (const key of Object.keys(trigger)) {
        if (!TRIGGER_KEYS[trigger.type].includes(key)) bad(`"trigger.${key}" no aplica a un disparador ${trigger.type}.`)
      }
      validateTrigger(trigger, bad)
      if (trigger.type === 'http' && METHODS.includes(trigger.method) && typeof trigger.path === 'string') {
        const route = `${trigger.method} ${trigger.path}`
        if (routes.has(route)) bad(`la ruta ${route} ya la sirve ${routes.get(route)}.`)
        else routes.set(route, label)
      }
    }

    // Autorización: solo en HTTP
    const isHttp = trigger?.type === 'http'
    if (isHttp) {
      if (!isStringArray(fn.auth) || fn.auth.length === 0) {
        bad(`"auth" es obligatorio en HTTP: una lista de ${ROLES.join('/')} o ["public"].`)
      } else if (fn.auth.some((r) => ![...ROLES, 'public'].includes(r))) {
        bad(`"auth" solo admite: ${[...ROLES, 'public'].join(', ')}.`)
      } else if (fn.auth.includes('public') && fn.auth.length > 1) {
        bad('"public" no se combina con roles.')
      }
    } else if (fn.auth !== undefined) {
      bad('"auth" solo aplica a funciones HTTP.')
    }

    // Eventos
    const eventDriven = trigger?.type === 'sqs' || trigger?.type === 'eventbridge'
    for (const key of ['publishes', 'consumes']) {
      if (fn[key] === undefined) continue
      if (!isStringArray(fn[key]) || fn[key].some((e) => !EVENT.test(e))) bad(`"${key}" debe ser una lista de eventos en PascalCase.`)
    }
    if (eventDriven && (!Array.isArray(fn.consumes) || fn.consumes.length === 0)) {
      bad(`un disparador ${trigger.type} necesita "consumes" con los eventos que trata.`)
    }
    if (!eventDriven && fn.consumes !== undefined && trigger) {
      bad('"consumes" solo aplica a disparadores sqs o eventbridge.')
    }
    if (Array.isArray(fn.publishes)) fn.publishes.forEach((e) => published.add(e))

    // Permisos
    if (fn.uses !== undefined) {
      if (!Array.isArray(fn.uses)) bad('"uses" debe ser una lista.')
      else fn.uses.forEach((use, i) => {
        if (!isObject(use) || !USES_KINDS.includes(use.kind) || typeof use.name !== 'string' || !KEBAB.test(use.name) || !ACCESS.includes(use.access)) {
          bad(`uses[${i}] debe ser { kind: ${USES_KINDS.join('|')}, name: kebab-case, access: ${ACCESS.join('|')} }.`)
        }
      })
    }

    // Dimensionado
    optionalInt(fn, 'memoryMb', 128, 10240, bad)
    optionalInt(fn, 'timeoutSeconds', 1, 900, bad)
    optionalInt(fn, 'reservedConcurrency', 0, 1000, bad)
  })

  // Trazabilidad: un consumidor sin productor casi siempre es una errata.
  for (const fn of registry.functions) {
    for (const event of Array.isArray(fn?.consumes) ? fn.consumes : []) {
      if (!published.has(event)) warnings.push(`${fn.name}: consume ${event}, pero ninguna función lo publica.`)
    }
  }

  // El registro debe ser completo: todo *Handler.java está dado de alta.
  const registered = new Set(entries.keys())
  for (const file of handlerFiles) {
    if (!registered.has(file)) errors.push(`handler sin registrar: backend/${file} (añádelo a functions.json o renómbralo si no es un handler).`)
  }

  return { errors, warnings }
}

function validateTrigger(trigger, bad) {
  switch (trigger.type) {
    case 'http':
      if (!METHODS.includes(trigger.method)) bad(`"trigger.method" debe ser uno de: ${METHODS.join(', ')}.`)
      if (typeof trigger.path !== 'string' || !/^\/[A-Za-z0-9\-_/{}.]*$/.test(trigger.path)) bad('"trigger.path" debe empezar por "/" (parámetros como {id}).')
      break
    case 'sqs':
      if (typeof trigger.queue !== 'string' || !KEBAB.test(trigger.queue)) bad('"trigger.queue" debe ser kebab-case.')
      break
    case 'schedule':
      if (typeof trigger.expression !== 'string' || !SCHEDULE.test(trigger.expression)) bad('"trigger.expression" debe ser rate(...) o cron(...).')
      break
    case 'dynamodb-stream':
      if (typeof trigger.table !== 'string' || !KEBAB.test(trigger.table)) bad('"trigger.table" debe ser kebab-case.')
      break
    case 's3':
      if (typeof trigger.bucket !== 'string' || !KEBAB.test(trigger.bucket)) bad('"trigger.bucket" debe ser kebab-case.')
      if (trigger.prefix !== undefined && typeof trigger.prefix !== 'string') bad('"trigger.prefix" debe ser texto.')
      break
  }
}

function optionalInt(fn, key, min, max, bad) {
  if (fn[key] === undefined) return
  if (!Number.isInteger(fn[key]) || fn[key] < min || fn[key] > max) bad(`"${key}" debe ser un entero entre ${min} y ${max}.`)
}

// --- Bloques generados del README -------------------------------------------

const EMPTY = '_Todavía no hay ninguna._'
const KIND = { dynamodb: 'DynamoDB', s3: 'S3', secret: 'Secreto', sqs: 'SQS', cloudwatch: 'CloudWatch' }
const STATUS_ES = { planned: 'planeada', implemented: 'implementada' }
const statusOf = (f) => STATUS_ES[f.status ?? 'implemented']
const ACCESS_ES = { read: 'lectura', write: 'escritura', readwrite: 'lectura y escritura' }

const cell = (text) => String(text).replaceAll('|', '\\|')
const code = (text) => `\`${text}\``
const list = (items) => (items?.length ? items.map(code).join(', ') : '—')
const table = (header, rows) =>
  rows.length === 0
    ? EMPTY
    : [`| ${header.join(' | ')} |`, `| ${header.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n')

function describeTrigger(t) {
  switch (t.type) {
    case 'authorizer': return 'Authorizer de API Gateway'
    case 'sqs': return `SQS ${code(t.queue)}`
    case 'eventbridge': return 'EventBridge'
    case 'schedule': return `Programada ${code(t.expression)}`
    case 'dynamodb-stream': return `Stream de ${code(t.table)}`
    case 's3': return `S3 ${code(t.bucket + (t.prefix ? `/${t.prefix}` : ''))}`
    default: return t.type
  }
}

/** Los cuatro bloques que `sync` mantiene en backend/README.md. */
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
      ['Método', 'Ruta', 'Función', 'Servicio', 'Quién', 'Estado', 'Qué hace'],
      http.map((f) => [f.trigger.method, code(f.trigger.path), code(f.name), f.service, f.auth.includes('public') ? 'público' : f.auth.join(', '), statusOf(f), f.description]),
    ),
    triggers: table(
      ['Función', 'Servicio', 'Se dispara por', 'Consume', 'Publica', 'Estado', 'Qué hace'],
      async.map((f) => [code(f.name), f.service, describeTrigger(f.trigger), list(f.consumes), list(f.publishes), statusOf(f), f.description]),
    ),
    permissions: table(
      ['Función', 'Datos que toca', 'Publica eventos'],
      functions.map((f) => [
        code(f.name),
        f.uses?.length ? f.uses.map((u) => `${u.name} (${KIND[u.kind]}: ${ACCESS_ES[u.access]})`).join(', ') : '—',
        f.publishes?.length ? 'sí' : 'no',
      ]),
    ),
    events: table(
      ['Evento', 'Lo publica', 'Lo consumen'],
      [...events.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, { producers, consumers }]) => [code(name), list(producers), list(consumers)]),
    ),
  }
}

const SECTIONS = [
  ['routes', '### Rutas HTTP'],
  ['triggers', '### Funciones por eventos y por horario'],
  ['permissions', '### Permisos por función'],
  ['events', '### Eventos'],
]
const marker = (block, edge) => `<!-- functions:${block}:${edge} -->`
const wrap = (block, body) => `${marker(block, 'start')}\n${body}\n${marker(block, 'end')}`

/** Reescribe los bloques del README; si no existe ninguno, añade la sección "Funciones" al final. */
export function applyBlocks(readme, blocks) {
  const eol = readme.includes('\r\n') ? '\r\n' : '\n'
  let text = readme.replaceAll('\r\n', '\n')
  const present = SECTIONS.filter(([block]) => text.includes(marker(block, 'start')))

  if (present.length === 0) {
    const intro = 'Generado desde `functions.json` (`node .claude/skills/functions-registry/scripts/functions.mjs sync`). No lo edites a mano.'
    const body = SECTIONS.map(([block, heading]) => `${heading}\n\n${wrap(block, blocks[block])}`).join('\n\n')
    text = `${text.replace(/\n*$/, '\n')}\n## Funciones\n\n${intro}\n\n${body}\n`
  } else if (present.length < SECTIONS.length) {
    const missing = SECTIONS.filter((s) => !present.includes(s)).map(([block]) => block)
    throw new Error(`backend/README.md tiene marcadores a medias (faltan: ${missing.join(', ')}). Restáuralos o bórralos todos.`)
  } else {
    for (const [block] of SECTIONS) {
      const pattern = new RegExp(`${escapeRegExp(marker(block, 'start'))}[\\s\\S]*?${escapeRegExp(marker(block, 'end'))}`)
      if (!pattern.test(text)) throw new Error(`Falta el marcador de cierre de "${block}" en backend/README.md.`)
      text = text.replace(pattern, () => wrap(block, blocks[block]))
    }
  }
  return text.replaceAll('\n', eol)
}

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// --- Sistema de ficheros y CLI ----------------------------------------------

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
  if (!existsSync(registryPath)) throw new Error(`No existe ${REGISTRY}.`)
  let registry
  try {
    registry = JSON.parse(await readFile(registryPath, 'utf8'))
  } catch (error) {
    throw new Error(`${REGISTRY} no es JSON válido: ${error.message}`)
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
    console.error(`\n${errors.length} error(es) en ${REGISTRY}. No se ha tocado el README.`)
    return 1
  }

  const readmePath = join(root, README)
  const existing = existsSync(readmePath) ? await readFile(readmePath, 'utf8') : ''
  const current = existing.trim() === '' ? '# backend\n' : existing
  const next = applyBlocks(current, renderBlocks(registry.functions))
  const upToDate = next === existing

  if (command === 'check') {
    if (!upToDate) {
      console.error(`ERROR  ${README} está desfasado respecto a ${REGISTRY}. Ejecuta: node .claude/skills/functions-registry/scripts/functions.mjs sync`)
      return 1
    }
    console.log(`OK  ${registry.functions.length} función(es) válidas y ${README} al día.`)
    return 0
  }

  if (!upToDate) await writeFile(readmePath, next)
  console.log(upToDate ? `OK  ${README} ya estaba al día.` : `OK  ${README} actualizado (${registry.functions.length} función(es)).`)
  return 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  const command = args[0]
  const rootFlag = args.indexOf('--root')
  const root = resolve(rootFlag >= 0 ? args[rootFlag + 1] : join(dirname(fileURLToPath(import.meta.url)), '../../../..'))

  if (command !== 'check' && command !== 'sync') {
    console.error('Uso: functions.mjs <check|sync> [--root <dir>]')
    process.exit(2)
  }
  try {
    process.exitCode = await run(command, root)
  } catch (error) {
    console.error(`ERROR  ${error.message}`)
    process.exitCode = 1
  }
}
