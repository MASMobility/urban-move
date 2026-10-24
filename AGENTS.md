# AGENTS.md — UrbanMove

UrbanMove is a Cloud Computing final project (ULPGC): a distributed urban mobility system (bicycles and scooters) **100% serverless on AWS**.

## Layout
A monorepo with one folder per layer. Every folder has its own `README.md` and the root has one too.

| Folder | Content |
|---|---|
| `frontend/` | Astro + Tailwind CSS client apps: users, maintenance/operations, and dashboard. |
| `backend/` | Java Lambdas, one Maven module per microservice (`backend/<service>/`), built with the Maven Wrapper (`./mvnw`). `backend/functions.json` registers every function. |
| `db/` | DynamoDB table schemas per service, keys, access patterns, and seeds. |
| `infrastructure/` | Terraform. It reads `backend/functions.json` to create Lambdas, routes and IAM; it does not list them by hand. |
| `docs/` | `.drawio` diagrams, ADRs (`docs/adr/`), API contracts, and event schemas. |

Stack: Terraform, Java, Astro, Gatling (Java, location to be decided). Only serverless AWS services: Lambda, API Gateway, DynamoDB, SQS/SNS/EventBridge, S3, Step Functions, CloudWatch. No EC2/ECS/RDS unless explicitly justified.

## Shared agent structure
- `AGENTS.md` is the single source of truth for agent instructions (OpenCode reads it natively; `CLAUDE.md` imports it).
- `.claude/skills/` holds the versioned skills; Claude Code and OpenCode both read it. No symlinks (Windows compatibility). Third-party skills include a `LICENSE` and a `PROVENANCE.md` (origin and local changes). Review a skill's `SKILL.md` and scripts before installing it.
- SDD agents (coordinator, planner, implementer, reviewer): prompts live once in `.opencode/prompts/`. OpenCode defines the agents and their permissions in `opencode.jsonc`; Claude Code defines them in `.claude/agents/` (they point to the same prompts). Run the coordinator with the Tab key in OpenCode or `claude --agent coordinator` in Claude Code.
- SDD (spec, plan, tasks in `specs/NNN-name/`): skill `sdd`. `tasks.md` is the shared task list: anyone can take a task by setting its Owner.
- Personal OpenCode config (MCP servers, keys) goes in the git-ignored `opencode.json` or in `~/.config/opencode/`. Never put secrets in `opencode.jsonc`.

## Architecture: stateless serverless microservices
This is the core design principle of the project; everything else derives from it:
- **Serverless microservices**: each microservice is a set of Lambdas (`backend/<service>/`) with a single responsibility, its own storage, and independent deployment.
- **Stateless compute**: a Lambda stores nothing between invocations (not in memory, disk, or static variables). Anything to remember lives in DynamoDB, S3, or Secrets Manager. In-memory caching is only acceptable as a volatile optimization.
- **Serverless sessions**: authentication uses a signed token validated by `identity-authorize`; no in-memory sessions or instance affinity.
- **Data ownership**: each service owns its data. No service reads or writes another's tables; communication goes through APIs or domain events (an SQS queue in front of every consumer).
- **Idempotent handlers**: events are delivered at least once. Processing the same `eventId` twice must not duplicate anything; conditions go in the DynamoDB write (condition expressions), not in an `if`.
- **Data Lake**: collects events for analytics. It is not a transactional database; operations read and write the service-owned tables.
- If a change needs state in compute, rethink it or write an ADR (skill `write-adr`).

## Single source of truth: `backend/functions.json`
Every Lambda is registered in `backend/functions.json`. Packaging, Terraform, and the README tables come from this file.
- When you add, rename, delete, or change a function's trigger, permissions, or events, **update `functions.json` in the same change**.
- Run `node .claude/skills/functions-registry/scripts/functions.mjs sync` (skill `functions-registry`) and make sure `... check` passes.

## Verification
Run from the repo root. Run the checks of every layer you touched before calling a task done. A layer's command may not exist yet: say so, do not invent it.

| Layer | Check |
|---|---|
| Function registry | `node .claude/skills/functions-registry/scripts/functions.mjs check` |
| Registry tool | `node --test .claude/skills/functions-registry/scripts/` |
| Agent harness (skills, agents, config) | `python scripts/check_harness.py` |
| Backend (Java) | `./mvnw test` inside `backend/` (`mvnw.cmd` on Windows) |
| Infrastructure | `terraform -chdir=infrastructure fmt -check -recursive` and `terraform -chdir=infrastructure validate` |
| Frontend | `npm --prefix frontend run build` (add the test script names here when `frontend/package.json` exists) |

`node --test` only covers the registry tool; backend tests are Java.

## Conventions
- **Language: English everywhere in the repository** (code, comments, READMEs, ADRs, specs, `functions.json`, skills, agents, `MEMORY.md`): it saves tokens and keeps one language. Talking to the team in chat can be in Spanish; what gets written to a file is English. The course PDF is written separately.
- Domain events carry: `id`, `timestamp`, `origin`, `type`, `schemaVersion`, and `correlationId`.
- Diagrams: skill `aws-architecture-diagram`, output to `docs/*.drawio`.
- READMEs per folder: skill `project-readmes`. Architecture decisions that compare alternatives: skill `write-adr`, in `docs/adr/`. Each fact lives in a single README; the others link to it.
- Code style, naming and comment language follow the existing code and the folder READMEs.

## Known pitfalls
- **Target environment** (ADR-0001): the same Terraform runs on LocalStack (local development) and on AWS (Academy or real). AWS Academy cannot create IAM roles: use `LabRole`. LocalStack needs a per-person account and token (`LOCALSTACK_AUTH_TOKEN`, never in the repo); API Gateway v2 is not in its Hobby plan, so check the team plan before writing Terraform.
- **Terraform state** (ADR-0002) is local per person; never commit it.
- **Lambdas** (ADR-0003): one per handler. A handler is the Java class/method Lambda runs; not every handler is an HTTP endpoint.
- **API Gateway** HTTP APIs time out after 30 s; long jobs must be asynchronous.

## Workflow
- Read `MEMORY.md` first.
- Small or local changes: do them directly. New services, new flows, or changes across services, `functions.json` or Terraform: plan first. For features that deserve a spec, use the SDD coordinator agent.
- Keep each change focused on one function, service, or concern.
- When you finish, say what changed, which checks you ran and their result, and what is left.

## Memory
- At the start, read `MEMORY.md` to learn the project status and decisions made.
- When you finish a task, append one line (`- YYYY-MM-DD (who): fact`) at the end of the right section: status, decision (with its why), pitfall, or next step. Never rewrite or reorder other people's lines; `.gitattributes` makes concurrent appends merge cleanly.
- Maximum 200 lines. Over that, one person prunes it in a separate commit (`chore(memory): prune`).
- Architecture decisions that compare alternatives are ADRs (`write-adr`): link the ADR instead of copying it.
- If something becomes a permanent rule, propose moving it to `AGENTS.md`.
- Never store sensitive data (keys, tokens, personal data).

## Boundaries
- ✅ Always: keep `functions.json` in sync with the handlers, run the checks of what you touched, update `MEMORY.md` after finishing a task.
- ⚠️ Ask first: new dependencies, new folders outside the layout, changes to event or data formats, and anything that creates AWS resources or costs (`terraform apply`, `aws` commands).
- 🚫 Never: commit credentials, tokens, or account IDs (`terraform.tfvars` and `*.tfstate` stay in `.gitignore`); edit by hand the generated blocks of `backend/README.md`; read or write another service's tables; change a third-party skill without recording it in its `PROVENANCE.md`.
