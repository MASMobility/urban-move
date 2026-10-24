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
  description: 'Crea una reserva sobre un recurso disponible.',
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
  description: 'Libera las reservas que no se confirman a tiempo.',
  entry: `${HANDLER_DIR}/ExpireReservationsHandler.java`,
  handler: 'com.urbanmove.reservations.ExpireReservationsHandler::handleRequest',
  trigger: { type: 'schedule', expression: 'rate(1 minute)' },
  publishes: ['ReservationExpired'],
}
const record = {
  name: 'history-record',
  service: 'history',
  description: 'Guarda cada evento en el historial.',
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

test('un registro correcto no da errores', async () => {
  const root = await repo([create, expire, record])
  const { errors, warnings } = validate({ functions: [create, expire, record] }, { backendDir: join(root, 'backend') })
  assert.deepEqual(errors, [])
  assert.deepEqual(warnings, [])
  await rm(root, { recursive: true })
})

test('detecta duplicados, erratas y handler que no cuadra con entry', async () => {
  const root = await repo([create])
  const broken = [
    create,
    { ...create, name: 'reservations-create' },
    { ...expire, acces: 'x', handler: 'com.urbanmove.reservations.Otra::handleRequest' },
  ]
  const { errors } = validate({ functions: broken }, { backendDir: join(root, 'backend') })
  const text = errors.join('\n')
  assert.match(text, /nombre duplicado/)
  assert.match(text, /ya la sirve/)
  assert.match(text, /campo desconocido "acces"/)
  assert.match(text, /no corresponde con "entry"/)
  await rm(root, { recursive: true })
})

test('exige auth en HTTP, consumes en SQS y servicio coherente con el módulo', async () => {
  const root = await repo([create, record])
  const { errors } = validate(
    { functions: [{ ...create, auth: undefined }, { ...record, consumes: undefined }, { ...expire, service: 'rides', name: 'rides-expire' }] },
    { backendDir: join(root, 'backend') },
  )
  const text = errors.join('\n')
  assert.match(text, /"auth" es obligatorio en HTTP/)
  assert.match(text, /necesita "consumes"/)
  assert.match(text, /debe estar en el módulo "rides\/"/)
  await rm(root, { recursive: true })
})

test('un handler sin registrar es un error y un consumidor huérfano un aviso', async () => {
  const root = await repo([create, record], { extraHandlers: [`${HANDLER_DIR}/LooseHandler.java`] })
  const registry = { functions: [create, record] }
  const { errors, warnings } = validate(registry, {
    backendDir: join(root, 'backend'),
    handlerFiles: [create.entry, record.entry, `${HANDLER_DIR}/LooseHandler.java`],
  })
  assert.equal(errors.length, 1)
  assert.match(errors[0], /handler sin registrar: backend\/reservations\/.*LooseHandler/)
  assert.match(warnings.join('\n'), /history-record: consume ReservationExpired/)
  await rm(root, { recursive: true })
})

test('una función planned no necesita su fichero; si existe, avisa', async () => {
  const root = await repo([create])
  const planned = { ...expire, status: 'planned' }
  const ok = validate({ functions: [create, planned] }, { backendDir: join(root, 'backend') })
  assert.deepEqual(ok.errors, [])
  assert.deepEqual(ok.warnings, [])

  const missing = validate({ functions: [create, expire] }, { backendDir: join(root, 'backend') })
  assert.match(missing.errors.join('\n'), /"entry" no existe.*"status": "planned"/)

  const stale = validate({ functions: [{ ...create, status: 'planned' }] }, { backendDir: join(root, 'backend') })
  assert.match(stale.warnings.join('\n'), /ya existe; márcala como "implemented"/)

  const wrong = validate({ functions: [{ ...create, status: 'done' }] }, { backendDir: join(root, 'backend') })
  assert.match(wrong.errors.join('\n'), /"status" debe ser/)
  await rm(root, { recursive: true })
})

test('el authorizer y los usos de sqs/cloudwatch son válidos; authorizer no admite auth', async () => {
  const root = await repo([create])
  const authorizer = { ...expire, name: 'reservations-authorize', status: 'planned', trigger: { type: 'authorizer' }, publishes: undefined,
    uses: [{ kind: 'sqs', name: 'dead-letter-queues', access: 'read' }, { kind: 'cloudwatch', name: 'metrics', access: 'read' }] }
  assert.deepEqual(validate({ functions: [create, authorizer] }, { backendDir: join(root, 'backend') }).errors, [])
  const bad = validate({ functions: [{ ...authorizer, auth: ['user'] }] }, { backendDir: join(root, 'backend') })
  assert.match(bad.errors.join('\n'), /"auth" solo aplica a funciones HTTP/)
  assert.match(renderBlocks([authorizer]).triggers, /Authorizer de API Gateway/)
  await rm(root, { recursive: true })
})

test('renderBlocks cruza productores y consumidores de eventos', () => {
  const { events, routes, triggers } = renderBlocks([create, expire, record])
  assert.match(events, /\| `ReservationExpired` \| `reservations-expire` \| `history-record` \|/)
  assert.match(routes, /\| POST \| `\/reservations` \| `reservations-create` \| reservations \| user \|/)
  assert.match(triggers, /Programada `rate\(1 minute\)`/)
  assert.match(triggers, /SQS `history-events`/)
})

test('sync añade la sección, check detecta desfases y sync es idempotente', async () => {
  const root = await repo([create, expire, record], { readme: '# backend\n\nTexto propio.\n' })
  assert.equal(await quiet(() => run('check', root)), 1)

  assert.equal(await quiet(() => run('sync', root)), 0)
  const first = await readFile(join(root, 'backend/README.md'), 'utf8')
  assert.match(first, /Texto propio\./)
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

test('sync no toca el README si el registro es inválido', async () => {
  const root = await repo([create], { readme: '# backend\n' })
  await writeFile(join(root, 'backend/functions.json'), JSON.stringify({ functions: [{ ...create, trigger: { type: 'http', method: 'POST' } }] }))
  assert.equal(await quiet(() => run('sync', root)), 1)
  assert.equal(await readFile(join(root, 'backend/README.md'), 'utf8'), '# backend\n')
  await rm(root, { recursive: true })
})

test('respeta los saltos de línea CRLF', () => {
  const out = applyBlocks('# backend\r\n', renderBlocks([]))
  assert.ok(out.includes('\r\n') && !/[^\r]\n/.test(out))
})
