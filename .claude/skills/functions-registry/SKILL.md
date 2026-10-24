---
name: functions-registry
description: "Maintains backend/functions.json, the single registry of every UrbanMove Lambda (HTTP route, SQS/EventBridge/cron trigger, permissions, events it publishes and consumes), and the generated tables of backend/README.md. Use it ALWAYS when you create, delete or rename a Lambda handler, or change its route, trigger, permissions or events, or touch Terraform or README content that depends on the registry."
---

# functions.json: the function registry

`backend/functions.json` is the **single source** of which Lambdas exist. It feeds:

| Consumer | What it takes from the registry |
|---|---|
| Packaging (Maven) | which module and which handler each function has |
| `infrastructure/` (Terraform) | the Lambdas, their API Gateway routes, their triggers and their IAM (`uses`, `publishes`) |
| `backend/README.md` | four generated tables: routes, event-driven functions, permissions, events |
| The course PDF | event contracts (who publishes, who consumes) and data ownership |

If code and registry drift apart, Terraform deploys something that is not there and the README lies. So the
registry changes **in the same change** as the code and is checked by a script.

## When to touch it

- A new handler, or a handler deleted, renamed or moved to another module.
- The method or route changes, the roles that may call it, or its trigger (SQS, EventBridge, cron...).
- The function starts or stops using a DynamoDB table, an S3 bucket or a secret.
- The function starts or stops publishing or consuming a domain event.
- Memory, timeout or reserved concurrency change.

If you doubt whether a change affects it, run `check`: it is cheap.

## Flow

1. Edit `backend/functions.json` together with the code.
2. `node .claude/skills/functions-registry/scripts/functions.mjs sync`
   validates the registry and regenerates the blocks of `backend/README.md`. If there are errors it writes nothing.
3. `node .claude/skills/functions-registry/scripts/functions.mjs check`
   must end with `OK` (exit 0). CI runs it.
4. Commit code, `functions.json` and README together.

The blocks between `<!-- functions:...:start -->` and `<!-- functions:...:end -->` are written by the script:
**do not edit them by hand**. If one is missing, `sync` appends a "Functions" section to the README the first
time. Everything else in the README is own text and is never touched.

## From `planned` to `implemented`

The registry can be written before the code: a `planned` function documents the design (routes, permissions,
events) and already appears in the tables with status "planned". When you create its handler, remove the
`status` field (or set `implemented`); the validator warns if the file already exists and the function is still
`planned`. Terraform and packaging only deploy `implemented` functions.

## Conventions the validator enforces

- One Maven module per microservice: `backend/<service>/`. A function lives in the module of its service.
- Handlers are in `src/main/java/...` and their class ends in `Handler` (`CreateReservationHandler`).
  Any `*Handler.java` that is not in the registry is an error: that is how code never goes unregistered.
- `name` = `<service>-<action>` in kebab-case (max 64): `reservations-create`.
- One function per handler and one function per route (method + path).

## Schema of each function

| Field | Required | Value |
|---|---|---|
| `name` | yes | `<service>-<action>`, kebab-case, unique |
| `service` | yes | owning microservice; matches the module of `entry` |
| `status` | no | `planned` (designed, no handler yet) or `implemented` (default). Only `implemented` requires `entry` to exist |
| `description` | yes | one sentence; it appears in the README tables |
| `entry` | yes | handler source, relative to `backend/`: `<service>/src/main/java/<package>/<Class>.java` |
| `handler` | yes | `package.Class::method`; must match `entry` |
| `trigger` | yes | see below |
| `auth` | HTTP only | list of `user`, `maintenance`, `admin`, or `["public"]` |
| `uses` | no | `[{ "kind": "dynamodb"\|"s3"\|"secret"\|"sqs"\|"cloudwatch", "name": "kebab", "access": "read"\|"write"\|"readwrite" }]` |
| `publishes` | no | domain events it emits (PascalCase: `VehicleReserved`) |
| `consumes` | sqs/eventbridge | events it handles; required with those triggers, forbidden otherwise |
| `memoryMb`, `timeoutSeconds`, `reservedConcurrency` | no | integers; if missing, Terraform uses its defaults |

Triggers (`trigger.type`):

| Type | Fields | What for |
|---|---|---|
| `http` | `method`, `path` | API Gateway; `path` with parameters `{id}` |
| `authorizer` | — | API Gateway Lambda authorizer (validates the token once) |
| `sqs` | `queue` | consumer of a queue (the queue comes with its DLQ) |
| `eventbridge` | — | rule on the events of `consumes` |
| `schedule` | `expression` | `rate(1 minute)` or `cron(...)` |
| `dynamodb-stream` | `table` | changes of a table |
| `s3` | `bucket`, `prefix?` | new objects in the Data Lake |

A field that is not in these tables is an error (it catches typos). To add a new field, change it at the same
time in `scripts/functions.mjs` (validation and tables), in `scripts/functions.test.mjs` and here.

## Example

```json
{
  "name": "reservations-create",
  "service": "reservations",
  "description": "Creates a reservation on an available resource.",
  "entry": "reservations/src/main/java/com/urbanmove/reservations/CreateReservationHandler.java",
  "handler": "com.urbanmove.reservations.CreateReservationHandler::handleRequest",
  "trigger": { "type": "http", "method": "POST", "path": "/reservations" },
  "auth": ["user"],
  "uses": [{ "kind": "dynamodb", "name": "reservations", "access": "readwrite" }],
  "publishes": ["VehicleReserved"]
}
```

An event-driven function (queue consumer, no `auth`):

```json
{
  "name": "history-record",
  "service": "history",
  "description": "Stores every domain event in the history.",
  "entry": "history/src/main/java/com/urbanmove/history/RecordEventHandler.java",
  "handler": "com.urbanmove.history.RecordEventHandler::handleRequest",
  "trigger": { "type": "sqs", "queue": "history-events" },
  "consumes": ["VehicleReserved", "ReservationExpired", "RideFinished"],
  "uses": [{ "kind": "dynamodb", "name": "history", "access": "write" }]
}
```

## Rules for the agent

- Read the handler before filling `uses`, `publishes` and `consumes`: they must reflect what the code does,
  not what you think it does. Least privilege: `read` if it only reads.
- Event names are those of section 6 of the course statement (`UserRegistered`, `RideFinished`...). A warning
  "consumes X but no function publishes it" is almost always a typo or a missing function.
- Do not invent the `description`: summarize what the handler does.
- To read the registry from Terraform and for the AWS Academy limitations, see `references/terraform.md`.
