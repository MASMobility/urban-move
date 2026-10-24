# infrastructure — deployment with Terraform

All the infrastructure is **serverless** (Lambda, API Gateway, DynamoDB, SQS, EventBridge, S3, CloudWatch) and
is defined with Terraform. For now `infrastructure/` only contains this README: what follows is the planned
design, and each section is confirmed when the code is written (see "Pending").

## Environment

The same Terraform code is deployed to **LocalStack** (local development and tests) and to **AWS** (Academy or
real) when needed: what changes is the target, not the resources
([ADR-0001](../docs/adr/0001-define-infrastructure-with-terraform-on-localstack-and-aws.md)). Each person keeps
their own Terraform state locally
([ADR-0002](../docs/adr/0002-keep-terraform-state-local-per-person.md)).

Two things to keep in mind:

- LocalStack can no longer be used without an account: each person needs an account and a token
  (`LOCALSTACK_AUTH_TOKEN`, environment variables only, never in the repo). According to its documentation, API
  Gateway v2 (HTTP API) is not in the Hobby plan and is in the Student plan; **check the team's plan before
  writing the first module** (see "Pending").
- AWS Academy cannot create IAM roles and forces the use of `LabRole`.

## Terraform does not list the Lambdas

Lambdas, their routes and their permissions are **not written by hand**: Terraform walks
`backend/functions.json`, the same file used by packaging and by the tables of `backend/README.md`. Adding a
function is adding an entry there; the Lambda, its route and its permission appear together. Only functions
with status `implemented` are deployed: `planned` ones have no code to upload yet. A sketch of how the registry
is read is in `.claude/skills/functions-registry/references/terraform.md`.

What each trigger type of the registry creates:

| Trigger (`trigger.type`) | AWS resource |
| --- | --- |
| `http` | API Gateway route to the Lambda |
| `authorizer` | API Gateway authorizer that validates the token once |
| `sqs` | SQS queue in front of the function, with its dead-letter queue (DLQ) and retries |
| `eventbridge` | event bus rule |
| `schedule` | scheduled rule (`rate(...)` or `cron(...)`) |
| `s3` | bucket notification to the function |
| `dynamodb-stream` | link to the table's stream |

The rest comes from the other fields of the registry: `uses` generates the function's IAM policy (least
privilege on its table, bucket or secret), `publishes` gives it permission to publish to the bus, and
`memoryMb`, `timeoutSeconds` and `reservedConcurrency` size the Lambda.

## What is deployed separately

Data is kept apart from compute on purpose: Lambdas are redeployed many times a day and the tables and the Data
Lake must survive that. The exact split into modules is still to be defined.

## Events and queues

Producers emit events to the bus and each consumer has its own queue with a DLQ, so if a consumer fails the
producer does not notice and the event is not lost. Failed events can be listed and resent with
`GET /analytics/failed-events` and `POST /analytics/failed-events/replay`. Since delivery is at least once,
every consumer is idempotent.

## Clean up

A section the statement requires (section 17). It is filled in at every real deployment and kept up to date:

| What | Status |
| --- | --- |
| Resources created | pending |
| Resources deleted | pending |
| Resources still active | pending |
| Expected cost (or why there is none) | pending |
| Measures to avoid exposing credentials | `*.tfvars` and `*.tfstate` outside the repo; credentials only through environment variables or `~/.aws/` |

## Pending

- **Terraform modules and variables**, with the real `init`, `plan` and `apply` commands, and what the outputs
  show.
- **Check LocalStack:** the team's plan and token, and that API Gateway v2, EventBridge, SQS and Lambda with
  Java work as the design expects. If not, see the ways out of ADR-0001.
- **Per-person or per-environment prefix** in resource names, so two people do not collide in the same Academy
  account (ADR-0002).
- **Observability:** log groups with retention, dashboard and alarms, and which metric each one watches.
- **Scaling:** reserved concurrency and parallelism of the event functions.
- **Conscious simplifications:** what would be done differently in production (for example one role per
  function instead of `LabRole`).
