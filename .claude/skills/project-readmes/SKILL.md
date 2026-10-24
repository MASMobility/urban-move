---
name: project-readmes
description: "Writes and updates the UrbanMove READMEs (root, backend/, db/, frontend/, infrastructure/) in the style of the reference repo betta-tech/jornadas-cloud-2026: one README per folder that explains the why of each decision, with a folder tree, tables and decisions/pending sections. Use it when creating, redoing or reviewing any README, or when a code change leaves a README out of date."
---

# One README per folder, in the style of the reference repo

The model is [betta-tech/jornadas-cloud-2026](https://github.com/betta-tech/jornadas-cloud-2026): every folder
has its own README so it can be shown on its own, and the README explains **why** things are done that way,
not only how to start them. Here it is adapted to UrbanMove (Java + Terraform + Astro, several microservices,
events and a Data Lake). READMEs are written in English.

| README | Template | Data that comes from elsewhere |
|---|---|---|
| `README.md` (root) | `references/root.md` | real folders and real scripts |
| `backend/README.md` | `references/backend.md` | **tables generated from `backend/functions.json`** |
| `db/README.md` | `references/db.md` | keys and accesses of the code in `db/` |
| `frontend/README.md` | `references/frontend.md` | HTTP routes of `backend/functions.json` |
| `infrastructure/README.md` | `references/infrastructure.md` | Terraform modules and variables |

Open only the template of the README you are working on.

## Process

1. **Read the code before writing.** Every claim (command, route, table name, number of functions) comes from a
   file you have opened. What does not exist yet goes under "Pending"; nothing is invented.
2. **Backend: the registry rules.** Before touching `backend/README.md`, apply the `functions-registry` skill and
   run `node .claude/skills/functions-registry/scripts/functions.mjs sync`. The tables between
   `<!-- functions:...:start -->` and `<!-- functions:...:end -->` are not edited by hand; write around them.
3. **Write** following the template and the style rules below. Keep the existing own text: edit sections, do not
   rewrite the whole file unless needed.
4. **Verify** before finishing:
   - Every path in `` `backticks` `` that looks like a file or folder exists.
   - Every command that appears exists (a `package.json` script, a Maven goal, a Terraform command).
   - No fixed numbers that depend on the code ("eleven functions"): link the generated table or count with
     `functions.json`.
   - `node .claude/skills/functions-registry/scripts/functions.mjs check` passes.
5. **One fact, one home.** If it is already explained in another README, link it (`../db/README.md`) instead of
   copying it.

## Style (what makes that repo recognizable)

- **English, second person** ("Note that...", "ask for access on day one"). Direct, no filler.
- **A title with identity**: `# backend — UrbanMove Lambdas`, and an opening paragraph that says what is there
  and what is not (for example, "no runtime dependencies").
- **A folder tree** in a code block, with one sentence per line aligned in a column. After it, the design rule
  that justifies it ("handlers know nothing about the database").
- **Tables** for everything enumerable: routes, keys, metrics, modules, access patterns.
- **The why, with the discarded alternative.** One paragraph per decision that starts with a bold sentence
  stating it: "**Points are computed by the server.**" followed by the reason and the cost.
- **Honest sections**: `## Decisions not to undo`, `## Conscious simplifications` (what would be done
  differently in production), `## What was left half-done on purpose` and `## Pending`. A known limitation goes
  in a quote (`> Known limitation: ...`) and points to the file where it is noted.
- **Callouts** with `>` for traps that cost time (deletion times, enabling cost tags...).
- **Real commands** in `bash` blocks, in the order they run, with a one-line comment.
- **Figures with units and origin**: cost per month, latency, limits. If it is an estimate, say so.
- **Exact references**: `infrastructure/modules/api/main.tf`, not "the API module".

## Which README serves which deliverable of the course statement

| Deliverable | Home |
|---|---|
| Local run instructions (9) | root `README.md`, "Run" |
| API documentation: endpoints, methods, codes (5) | `backend/README.md`, generated route table (+ contracts in `docs/`) |
| Events: producer, consumers, schema (6) | `backend/README.md`, generated event table (+ schemas in `docs/`) |
| Resource lifecycle and who validates each transition (section 5) | `backend/README.md` |
| Data ownership and data marts (7) | `db/README.md` |
| Deployment and infrastructure reproduction (10) | `infrastructure/README.md` |
| Resources created, deleted, still active, cost, credentials (17) | `infrastructure/README.md`, "Clean up" |
| Observability: logs, metrics, alarms, dashboard (12) | `backend/README.md` (what is emitted) and `infrastructure/README.md` (where it is seen) |
| CI/CD: tests, images or artifacts, validations (11) | root `README.md`, "Pipeline" section |
| Fault tolerance and scalability | decisions in the README of the affected layer, and an ADR (`write-adr`) |

The PDF is written from these READMEs: if a fact is missing here, it is missing in the delivery.

## Limits

- Do not write credentials, account IDs, real ARNs or private URLs in any README (requirement 17).
- Do not document what is not done as if it were: it goes under "Pending".
- Diagrams live in `docs/*.drawio` (skill `aws-architecture-diagram`); the README links them.
