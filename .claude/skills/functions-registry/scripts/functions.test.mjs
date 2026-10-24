// node --test .claude/skills/functions-registry/scripts/
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { run, validate, renderBlocks, applyBlocks } from './functions.mjs'

const HANDLER_DIR = 'reservations/src/main/java/com/urbanmove/reservations'

const create = {
  name: 'reservations-create',
  service: 'reservations',
  description: 'Creates a reservation on an available resource.',
  entry: `${HANDLER_DIR}/CreateReservationHandler.java`,
  handler: 'com.urbanmove.reservations.CreateReservationHandler::handleRequest',
  trigger: { type: 'http', method: 'POST', path: '/reservations' },
  auth: ['user'],
  uses: [{ kind: 'dynamodb', name: 'reservations', access: 'readwrite' }],
  publishes: ['VehicleReserved'],
}
const expire = {
  name: 'reservations-expire',
  service: 'reservations',
  description: 'Releases reservations that are not confirmed in time.',
  entry: `${HANDLER_DIR}/ExpireReservationsHandler.java`,
  handler: 'com.urbanmove.reservations.ExpireReservationsHandler::handleRequest',
  trigger: { type: 'schedule', expression: 'rate(1 minute)' },
  publishes: ['ReservationExpired'],
}
const record = {
  name: 'history-record',
  service: 'history',
  description: 'Stores every event in the history.',
  entry: 'history/src/main/java/com/urbanmove/history/RecordEventHandler.java',
  handler: 'com.urbanmove.history.RecordEventHandler::handleRequest',
  trigger: { type: 'sqs', queue: 'history-events' },
  consumes: ['VehicleReserved', 'ReservationExpired'],
}

async function repo(functions, { extraHandlers = [], readme } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'functions-'))
  await mkdir(join(root, 'backend'), { recursive: true })
  const files = new Set([...functions.map((f) => f.entry), ...extraHandlers])
  for (const file of files) {
    await mkdir(join(root, 'backend', file, '..'), { recursive: true })
    await writeFile(join(root, 'backend', file), 'class X {}')
  }
  await writeFile(join(root, 'backend/functions.json'), JSON.stringify({ functions }))
  if (readme !== undefined) await writeFile(join(root, 'backend/README.md'), readme)
  return root
}

const quiet = async (fn) => {
  const { log, error, warn } = console
  console.log = console.error = console.warn = () => {}
  try { return await fn() } finally { Object.assign(console, { log, error, warn }) }
}

test('a correct registry gives no errors', async () => {
  const root = await repo([create, expire, record])
  const { errors, warnings } = validate({ functions: [create, expire, record] }, { backendDir: join(root, 'backend') })
  assert.deepEqual(errors, [])
  assert.deepEqual(warnings, [])
  await rm(root, { recursive: true })
})

test('detects duplicates, typos and a handler that does not match entry', async () => {
  const root = await repo([create])
  const broken = [
    create,
    { ...create, name: 'reservations-create' },
    { ...expire, acces: 'x', handler: 'com.urbanmove.reservations.Otra::handleRequest' },
  ]
  const { errors } = validate({ functions: broken }, { backendDir: join(root, 'backend') })
  const text = errors.join('\n')
  assert.match(text, /duplicate name/)
  assert.match(text, /is already served by/)
  assert.match(text, /unknown field "acces"/)
  assert.match(text, /does not match "entry"/)
  await rm(root, { recursive: true })
})

test('requires auth for HTTP, consumes for SQS and a service that matches the module', async () => {
  const root = await repo([create, record])
  const { errors } = validate(
    { functions: [{ ...create, auth: undefined }, { ...record, consumes: undefined }, { ...expire, service: 'rides', name: 'rides-expire' }] },
    { backendDir: join(root, 'backend') },
  )
  const text = errors.join('\n')
  assert.match(text, /"auth" is required for HTTP/)
  assert.match(text, /needs "consumes"/)
  assert.match(text, /must be in the module "rides\/"/)
  await rm(root, { recursive: true })
})

test('an unregistered handler is an error and an orphan consumer a warning', async () => {
  const root = await repo([create, record], { extraHandlers: [`${HANDLER_DIR}/LooseHandler.java`] })
  const registry = { functions: [create, record] }
  const { errors, warnings } = validate(registry, {
    backendDir: join(root, 'backend'),
    handlerFiles: [create.entry, record.entry, `${HANDLER_DIR}/LooseHandler.java`],
  })
  assert.equal(errors.length, 1)
  assert.match(errors[0], /unregistered handler: backend\/reservations\/.*LooseHandler/)
  assert.match(warnings.join('\n'), /history-record: consumes ReservationExpired/)
  await rm(root, { recursive: true })
})

test('a planned function does not need its file; if it exists, it warns', async () => {
  const root = await repo([create])
  const planned = { ...expire, status: 'planned' }
  const ok = validate({ functions: [create, planned] }, { backendDir: join(root, 'backend') })
  assert.deepEqual(ok.errors, [])
  assert.deepEqual(ok.warnings, [])

  const missing = validate({ functions: [create, expire] }, { backendDir: join(root, 'backend') })
  assert.match(missing.errors.join('\n'), /"entry" does not exist.*"status": "planned"/)

  const stale = validate({ functions: [{ ...create, status: 'planned' }] }, { backendDir: join(root, 'backend') })
  assert.match(stale.warnings.join('\n'), /already exists; mark it as "implemented"/)

  const wrong = validate({ functions: [{ ...create, status: 'done' }] }, { backendDir: join(root, 'backend') })
  assert.match(wrong.errors.join('\n'), /"status" must be/)
  await rm(root, { recursive: true })
})

test('the authorizer and sqs/cloudwatch uses are valid; an authorizer does not accept auth', async () => {
  const root = await repo([create])
  const authorizer = { ...expire, name: 'reservations-authorize', status: 'planned', trigger: { type: 'authorizer' }, publishes: undefined,
    uses: [{ kind: 'sqs', name: 'dead-letter-queues', access: 'read' }, { kind: 'cloudwatch', name: 'metrics', access: 'read' }] }
  assert.deepEqual(validate({ functions: [create, authorizer] }, { backendDir: join(root, 'backend') }).errors, [])
  const bad = validate({ functions: [{ ...authorizer, auth: ['user'] }] }, { backendDir: join(root, 'backend') })
  assert.match(bad.errors.join('\n'), /"auth" only applies to HTTP functions/)
  assert.match(renderBlocks([authorizer]).triggers, /API Gateway authorizer/)
  await rm(root, { recursive: true })
})

test('renderBlocks matches event producers and consumers', () => {
  const { events, routes, triggers } = renderBlocks([create, expire, record])
  assert.match(events, /\| `ReservationExpired` \| `reservations-expire` \| `history-record` \|/)
  assert.match(routes, /\| POST \| `\/reservations` \| `reservations-create` \| reservations \| user \|/)
  assert.match(triggers, /Scheduled `rate\(1 minute\)`/)
  assert.match(triggers, /SQS `history-events`/)
})

test('sync adds the section, check detects drift and sync is idempotent', async () => {
  const root = await repo([create, expire, record], { readme: '# backend\n\nOwn text.\n' })
  assert.equal(await quiet(() => run('check', root)), 1)

  assert.equal(await quiet(() => run('sync', root)), 0)
  const first = await readFile(join(root, 'backend/README.md'), 'utf8')
  assert.match(first, /Own text\./)
  assert.match(first, /<!-- functions:routes:start -->/)
  assert.equal(await quiet(() => run('check', root)), 0)

  await quiet(() => run('sync', root))
  assert.equal(await readFile(join(root, 'backend/README.md'), 'utf8'), first)

  await writeFile(join(root, 'backend/functions.json'), JSON.stringify({ functions: [create, expire, record, { ...create, name: 'reservations-cancel', entry: `${HANDLER_DIR}/CancelReservationHandler.java`, handler: 'com.urbanmove.reservations.CancelReservationHandler::handleRequest', trigger: { type: 'http', method: 'POST', path: '/reservations/{id}/cancel' } }] }))
  await writeFile(join(root, 'backend', `${HANDLER_DIR}/CancelReservationHandler.java`), 'class X {}')
  assert.equal(await quiet(() => run('check', root)), 1)
  await quiet(() => run('sync', root))
  assert.match(await readFile(join(root, 'backend/README.md'), 'utf8'), /reservations-cancel/)
  await rm(root, { recursive: true })
})

test('sync does not touch the README if the registry is invalid', async () => {
  const root = await repo([create], { readme: '# backend\n' })
  await writeFile(join(root, 'backend/functions.json'), JSON.stringify({ functions: [{ ...create, trigger: { type: 'http', method: 'POST' } }] }))
  assert.equal(await quiet(() => run('sync', root)), 1)
  assert.equal(await readFile(join(root, 'backend/README.md'), 'utf8'), '# backend\n')
  await rm(root, { recursive: true })
})

test('keeps CRLF line endings', () => {
  const out = applyBlocks('# backend\r\n', renderBlocks([]))
  assert.ok(out.includes('\r\n') && !/[^\r]\n/.test(out))
})
