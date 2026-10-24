---
name: functions-registry
description: Mantiene backend/functions.json, el registro único de todas las Lambdas de UrbanMove (ruta HTTP, disparador SQS/EventBridge/cron, permisos, eventos que publica y consume) y las tablas generadas de backend/README.md. Úsala SIEMPRE que crees, borres o renombres un handler o Lambda Java, cambies su ruta, disparador, permisos o eventos, o toques Terraform/README que dependan del registro. Use whenever a Lambda handler, route, trigger, IAM access or domain event changes.
---

# functions.json: el registro de funciones

`backend/functions.json` es la **única fuente** de qué Lambdas existen. De él salen:

| Consumidor | Qué toma del registro |
|---|---|
| Empaquetado (Maven) | qué módulo y qué handler hay en cada función |
| `infrastructure/` (Terraform) | las Lambdas, sus rutas de API Gateway, sus disparadores y su IAM (`uses`, `publishes`) |
| `backend/README.md` | cuatro tablas generadas: rutas, funciones por eventos, permisos, eventos |
| Documentación del PDF | contratos de eventos (quién publica, quién consume) y propiedad de datos |

Si el código y el registro se separan, Terraform despliega lo que no es y el README miente. Por eso el
registro se actualiza **en el mismo cambio** que el código y se comprueba con un script.

## Cuándo hay que tocarlo

- Nuevo handler, o handler borrado/renombrado/movido de módulo.
- Cambia el método o la ruta, el rol que puede llamarla, o el disparador (SQS, EventBridge, cron...).
- La función empieza o deja de usar una tabla DynamoDB, un bucket S3 o un secreto.
- La función empieza o deja de publicar o consumir un evento de dominio.
- Cambia la memoria, el timeout o la concurrencia reservada.

Si dudas de si un cambio lo afecta, ejecuta `check`: es barato.

## Flujo

1. Edita `backend/functions.json` junto con el código.
2. `node .claude/skills/functions-registry/scripts/functions.mjs sync`
   valida el registro y regenera los bloques de `backend/README.md`. Si hay errores no escribe nada.
3. `node .claude/skills/functions-registry/scripts/functions.mjs check`
   debe acabar en `OK` (exit 0). Es lo que ha de ejecutar CI.
4. Commitea código, `functions.json` y README juntos.

Los bloques entre `<!-- functions:...:start -->` y `<!-- functions:...:end -->` los escribe el script:
**no se editan a mano**. Si falta alguno, `sync` añade la sección "Funciones" al final del README la
primera vez. Todo lo demás del README es texto propio y no se toca.

## De `planned` a `implemented`

El registro se puede escribir antes que el código: una función `planned` documenta el diseño (rutas,
permisos, eventos) y ya sale en las tablas con estado «planeada». Al crear su handler, quita el campo
`status` (o pon `implemented`); el validador avisa si el fichero ya existe y la función sigue `planned`.
Terraform y el empaquetado solo despliegan las `implemented`.

## Convenciones que el validador exige

- Un módulo Maven por microservicio: `backend/<servicio>/`. Una función vive en el módulo de su servicio.
- Los handlers están en `src/main/java/...`, y su clase acaba en `Handler` (`CreateReservationHandler`).
  Cualquier `*Handler.java` que no esté en el registro es un error: así no se queda código sin dar de alta.
- `name` = `<servicio>-<acción>` en kebab-case (máx. 64): `reservations-create`.
- Una función por handler y una función por ruta (método + ruta).

## Esquema de cada función

| Campo | Obligatorio | Valor |
|---|---|---|
| `name` | sí | `<servicio>-<acción>`, kebab-case, único |
| `service` | sí | microservicio dueño; coincide con el módulo de `entry` |
| `status` | no | `planned` (diseñada, sin handler todavía) o `implemented` (por defecto). Solo `implemented` exige que exista `entry` |
| `description` | sí | una frase; sale en las tablas del README |
| `entry` | sí | fuente del handler, relativa a `backend/`: `<servicio>/src/main/java/<paquete>/<Clase>.java` |
| `handler` | sí | `paquete.Clase::metodo`; debe coincidir con `entry` |
| `trigger` | sí | ver abajo |
| `auth` | solo HTTP | lista de `user`, `maintenance`, `admin`, o `["public"]` |
| `uses` | no | `[{ "kind": "dynamodb"\|"s3"\|"secret"\|"sqs"\|"cloudwatch", "name": "kebab", "access": "read"\|"write"\|"readwrite" }]` |
| `publishes` | no | eventos de dominio que emite (PascalCase: `VehicleReserved`) |
| `consumes` | sqs/eventbridge | eventos que trata; obligatorio con esos disparadores, prohibido en el resto |
| `memoryMb`, `timeoutSeconds`, `reservedConcurrency` | no | enteros; si faltan, Terraform usa sus valores por defecto |

Disparadores (`trigger.type`):

| Tipo | Campos | Para qué |
|---|---|---|
| `http` | `method`, `path` | API Gateway; `path` con parámetros `{id}` |
| `authorizer` | — | Lambda authorizer de API Gateway (valida el token una vez) |
| `sqs` | `queue` | consumidor de una cola (la cola trae su DLQ) |
| `eventbridge` | — | regla por los eventos de `consumes` |
| `schedule` | `expression` | `rate(1 minute)` o `cron(...)` |
| `dynamodb-stream` | `table` | cambios de una tabla |
| `s3` | `bucket`, `prefix?` | objetos nuevos en el Data Lake |

Un campo que no esté en estas tablas es un error (sirve para cazar erratas). Para añadir un campo nuevo,
cámbialo a la vez en `scripts/functions.mjs` (validación y tablas), en `scripts/functions.test.mjs` y aquí.

## Ejemplo

```json
{
  "name": "reservations-create",
  "service": "reservations",
  "description": "Crea una reserva sobre un recurso disponible.",
  "entry": "reservations/src/main/java/com/urbanmove/reservations/CreateReservationHandler.java",
  "handler": "com.urbanmove.reservations.CreateReservationHandler::handleRequest",
  "trigger": { "type": "http", "method": "POST", "path": "/reservations" },
  "auth": ["user"],
  "uses": [{ "kind": "dynamodb", "name": "reservations", "access": "readwrite" }],
  "publishes": ["VehicleReserved"]
}
```

Ejemplo de función por eventos (consumidor de una cola, sin `auth`):

```json
{
  "name": "history-record",
  "service": "history",
  "description": "Guarda cada evento de dominio en el historial.",
  "entry": "history/src/main/java/com/urbanmove/history/RecordEventHandler.java",
  "handler": "com.urbanmove.history.RecordEventHandler::handleRequest",
  "trigger": { "type": "sqs", "queue": "history-events" },
  "consumes": ["VehicleReserved", "ReservationExpired", "RideFinished"],
  "uses": [{ "kind": "dynamodb", "name": "history", "access": "write" }]
}
```

## Reglas para el agente

- Lee el handler antes de rellenar `uses`, `publishes` y `consumes`: deben reflejar lo que el código hace,
  no lo que se piensa que hace. Mínimo privilegio: `read` si solo lee.
- Los nombres de evento son los de la sección 6 del enunciado (`UserRegistered`, `RideFinished`...). Un
  `AVISO` de "consume X pero nadie lo publica" casi siempre es una errata o una función que falta.
- No inventes el contenido de `description`: resume lo que hace el handler.
- Para usar el registro desde Terraform y para las limitaciones de AWS Academy, ver
  `references/terraform.md`.
