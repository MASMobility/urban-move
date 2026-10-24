# MEMORY.md — UrbanMove
Shared working memory for teammates and agents. Maximum 200 lines.

How to write here (so merges do not clash):
- Append ONE line at the END of the right section: `- YYYY-MM-DD (who): fact`. Do not rewrite, reorder or delete other people's lines.
- Git merges concurrent appends automatically (see `.gitattributes`). If the file passes 200 lines, one person prunes it in a separate commit `chore(memory): prune`.
- Decisions that compare alternatives are ADRs (`docs/adr/`, skill `write-adr`): link them, do not copy them.
- Permanent rules belong in `AGENTS.md`. Never store secrets or personal data.

## Current status
- 2026-10-24 (Marcial): `backend/functions.json` designs 66 functions in 16 services, all `planned` (no Java code yet). Folders `frontend/`, `backend/`, `db/`, `infrastructure/` exist; only `backend/README.md` has content.
- 2026-10-24 (Marcial): the agent harness is set up: skills in `.claude/skills/`, SDD agents for OpenCode (`opencode.jsonc`) and Claude Code (`.claude/agents/`), check with `python scripts/check_harness.py`.

## Decisions (and why)
- 2026-10-24 (Marcial): architecture is stateless serverless microservices (see AGENTS.md). Every Lambda is registered in `backend/functions.json`; the registry may run ahead of the code with `status: planned`.
- 2026-10-24 (Marcial): everything in the repository is written in English (code, READMEs, ADRs, specs, registry, skills, agents) to save tokens and keep one language; chat with the team can be Spanish.
- 2026-10-24 (Marcial): ADR-0001 same Terraform on LocalStack (local) and AWS (Academy/real); ADR-0002 Terraform state local per person; ADR-0003 one Lambda per handler (a handler is the Java entry point, not an endpoint). See docs/adr/.

## Pitfalls and lessons
- 2026-10-24 (Marcial): OpenCode silently skips markdown agents with invalid frontmatter; define agents in `opencode.jsonc`, not in `.opencode/agents/`.
- 2026-10-24 (Marcial): `SKILL.md` frontmatter must be strict YAML: quote any `description` that contains `: `. Names must equal the folder name and descriptions stay under 1024 characters.
- 2026-10-24 (Marcial): `node --test` exits 0 when there are no JS tests, so it proves nothing for the Java backend.
- 2026-10-24 (Marcial): AWS Academy cannot create IAM roles (use `LabRole`) and HTTP API integrations time out after 30 s.
- 2026-10-24 (Marcial): LocalStack has no free tier without account since 2026-03: needs a per-person token, and API Gateway v2 (HTTP API) is not in the Hobby plan (is in Student). Verify before writing Terraform.

## Next steps
- 2026-10-24 (Marcial): share the infrastructure sketch to compare it with `functions.json`.
- 2026-10-24 (Marcial): `db/`, `frontend/` and `infrastructure/` READMEs have a first version; complete them as code appears. ADR-0001..0003 exist; the bus ADR is pending research.
- 2026-10-24 (Marcial): research AWS infrastructure and the event bus (EventBridge/SNS/SQS) before deciding; the ADR on the bus is pending that research.

## Deferred (not done on purpose: implement when we know more about AWS and Terraform)
The agent harness (skills, SDD agents, registry check, memory, CI file) is enough for now. Everything below waits.
- 2026-10-24 (Marcial): research how to organize the AWS infrastructure and the event bus (EventBridge, SNS, SQS) and write its ADR. The research card has the questions to answer first.
- 2026-10-24 (Marcial): verify the LocalStack plan and token for the team, and that API Gateway v2, EventBridge, SQS and Lambda with Java work as the design expects (ADR-0001 risk).
- 2026-10-24 (Marcial): write the Terraform: modules, variables, per-person prefix in resource names, `init`/`plan`/`apply` commands, observability, scaling, and the "Recoger la mesa" table of `infrastructure/README.md`.
- 2026-10-24 (Marcial): fill the Verification table of `AGENTS.md` and the CI jobs as each layer appears (Java `./mvnw test`, Terraform `fmt`/`validate`, frontend scripts); update the reviewer allowlist in `opencode.jsonc`.
- 2026-10-24 (Marcial): review the infrastructure sketch against `backend/functions.json` and the PDF requirements.
- 2026-10-24 (Marcial): `db/` keys, access patterns and seeds; create the Astro project (one app or three) and its mobile performance budget.
- 2026-10-24 (Marcial): create one Trello card per function from `functions.json` (approach undecided: API script, MCP or CSV).
- 2026-10-24 (Marcial): undecided and low priority: Gatling location; splitting `functions.json` per service if merges conflict; translating our own skills (`functions-registry`, `project-readmes`, `write-adr`) to English; a markdownlint config.
- 2026-10-24 (Marcial): never exercised yet: the OpenCode Tab switch to `coordinator`, the GitHub CI run, and a full SDD spec through implementation. In Claude Code the reviewer's read-only Bash is only a prompt rule (OpenCode enforces it).
