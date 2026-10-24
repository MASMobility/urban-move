# AGENTS.md — Urban Move
UrbanMove is a Cloud Computing final project (ULPGC): a distributed urban mobility system (bicycles and scooters) **100% serverless on AWS**.

## Stack and structure
- **Infrastructure as Code**: Terraform (`infrastructure/`).
- **Backend**: AWS Lambda functions in Java (`backend/`), organized as a Maven module per microservice (`backend/<servicio>/`). Uses Maven Wrapper (`./mvnw`).
- **Frontend**: Astro + Tailwind CSS (`frontend/`). Includes client apps for users, maintenance/operations, and dashboard.
- **Load Testing**: Gatling (Java).
- **AWS Serverless Stack**: Lambda, API Gateway, DynamoDB, SQS/SNS/EventBridge, S3, Step Functions, CloudWatch. No EC2/ECS/RDS unless explicitly justified.
- **Data Model**: `db/` contains DynamoDB table schemas per service, keys, access patterns, and seeds.
- **Documentation**: `docs/` contains `.drawio` diagrams, ADRs (`docs/adr/`), API contracts, and event schemas.
- **Shared agent structure**:
  - `AGENTS.md` is the single source of truth for agent instructions (OpenCode reads it natively; `CLAUDE.md` imports it).
  - `.claude/skills/` contains versioned skills read natively by Claude Code and OpenCode. No symlinks are used for Windows compatibility.
  - Third-party skills include a `LICENSE` and a `PROVENANCE.md` file tracking origin and local changes. Do not install new skills without reviewing their `SKILL.md` and scripts first.

## Architecture: stateless serverless microservices
This is the core design principle of the project; everything else derives from it:
- **Serverless Microservices**: Each microservice is a collection of Lambdas (`backend/<service>/`) with single responsibility, its own storage, and independent deployment.
- **Stateless Compute**: A Lambda stores nothing between invocations (not in memory, disk, or static variables). Anything to remember lives externally in DynamoDB, S3, or Secrets Manager. In-memory caching is only acceptable as a volatile optimization.
- **Serverless Sessions**: Authentication uses a signed token validated by `identity-authorize`; no in-memory sessions or instance affinity.
- **Data Ownership**: Each service owns its data. No service reads or writes another's database; communication occurs via APIs or domain events (SQS queues in front of every consumer).
- **Idempotent Handlers**: Events are delivered at least once. Processing the same `eventId` twice must not duplicate operations; write conditions are handled in DynamoDB, not in `if` statements.
- **Data Lake**: Collects events for analytics; transactional operations must read/write to service-owned tables.
- If a change requires storing state in compute, write an ADR (skill `write-adr`).

## Single Source of Truth: `backend/functions.json`
Every Lambda function is registered in `backend/functions.json`. Packaging, Terraform, and README tables originate from this file.
- When adding, renaming, deleting, or altering a function's trigger, permissions, or events, **update `functions.json` in the same change**.
- Run `node .claude/skills/functions-registry/scripts/functions.mjs sync` (skill `functions-registry`). `... check` must pass before marking a task as complete.

## Commands
- **Maven Wrapper**: Use `./mvnw` (do not use global `mvn`).
- **Functions Registry Sync**: `node .claude/skills/functions-registry/scripts/functions.mjs sync`
- **Functions Registry Check**: `node .claude/skills/functions-registry/scripts/functions.mjs check`
- Prerequisites and exact run, test, lint, and build commands are detailed in `README.md` and `requirements.txt`.

## Conventions
- Code style, naming, language for comments and UI text must align with project READMEs and existing codebase conventions.
- Domain events must include: `id`, `timestamp`, `origin`, `type`, `schemaVersion`, and `correlationId`.
- Diagrams: Use the `aws-architecture-diagram` skill; output to `docs/*.drawio`.
- Documentation rules: READMEs per directory are managed via the `project-readmes` skill; architectural decisions are created via the `write-adr` skill in `docs/adr/`. Each piece of data lives in a single README; others link to it.

## Domain rules / Known pitfalls
- **Target Environment Limitations**: Verify AWS Academy vs. real AWS vs. LocalStack. AWS Academy restricts IAM permissions (use `LabRole`).
- **Idempotency**: Do not rely on in-memory checks for duplicate events; write condition expressions directly in DynamoDB.
- **Data Boundaries**: Never read or write another microservice's database tables directly.

## Workflow
- When to plan before touching code, size of changes, what to explain upon finishing.
- If a change requires storing state in compute, rethink the approach or write an ADR via `write-adr`.

## Memory
- At the start, read `MEMORY.md` to learn the project status and decisions made.
- Upon finishing a task, update it: current status, important decisions (with their rationale), and pitfalls to avoid.
- Keep it brief (maximum ~50 lines): summarize or remove anything that is no longer useful.
- If something becomes a permanent rule, propose moving it to `AGENTS.md` instead of leaving it in memory.
- Never store sensitive data (keys, tokens, personal data).

## Boundaries
- ✅ Always: update `MEMORY.md` after finishing each task.
- ⚠️ Ask first: new dependencies, new files, changes to data formats…
- 🚫 Never: what must not be touched under any circumstances.
- 🚫 Never commit credentials, tokens, or account IDs. Ensure `terraform.tfvars` and `*.tfstate` remain in `.gitignore`.

## Verification
- How to check that a change works before considering it finished.
- Ensure `node .claude/skills/functions-registry/scripts/functions.mjs check` passes before completing any backend/infrastructure changes.