---
name: sdd
description: "Spec-driven development for UrbanMove: templates and rules for spec.md (WHAT and WHY, requirements in EARS), plan.md (HOW) and tasks.md (shared task list) under specs/NNN-name/. Use when drafting, reviewing or updating a spec, plan or tasks, or when a feature touches several services and needs a written spec first."
---

# SDD: spec, plan, tasks

Each feature that deserves a spec lives in `specs/NNN-name/` (NNN = next free number, name in kebab-case) with three files, written in this order and approved by the user in between:

| File | Answers | Template | Gate |
|---|---|---|---|
| `spec.md` | WHAT and WHY. No stack, no files. | `templates/spec.md` | The user approves it (`Status: approved`) |
| `plan.md` | HOW. Layers, `functions.json` changes, events, data, decisions, tests. | `templates/plan.md` | The user approves it |
| `tasks.md` | The work, split so that anyone can pick one task. | `templates/tasks.md` | Same approval as the plan |

Small or local changes do not need a spec: do them directly.

Write specs, plans and tasks in English. Optional `clarifications.md` keeps the QA findings on the spec and the user's decisions, so they survive the session. After the user approves a spec or a plan, the planner sets its `Status: approved`.

## Requirements in EARS
Write each functional requirement as one sentence with an ID (`FR-1`, `FR-2`...). Use the pattern that fits:

| Pattern | Form |
|---|---|
| Always true | The `<system>` shall `<response>`. |
| Event | When `<trigger>`, the `<system>` shall `<response>`. |
| State | While `<state>`, the `<system>` shall `<response>`. |
| Unwanted case | If `<condition>`, then the `<system>` shall `<response>`. |
| Optional | Where `<feature>`, the `<system>` shall `<response>`. |

Name the real service or client app as `<system>` (`the reservations service`, `the user app`), so the requirement maps to a module. Use `Where` only for optional features or configuration; use `When` or `If` for conditions on data. One trigger or one unwanted case per FR. Each FR must be testable: someone can say if it holds or not.

## Rules
- The spec states behavior, not solutions. Technology, tables and files belong to the plan.
- Edge cases get their own IDs (`EC-1`...) and each one is covered by an FR or listed as out of scope.
- A change to an approved spec starts by editing `spec.md` (new FR, new edge case). Then the plan and tasks follow.
- The plan must cover every FR and say which task implements it. It lists the changes to `backend/functions.json` (skill `functions-registry`) and the architecture decisions that need an ADR (skill `write-adr`).
- Time-dependent logic (reservation expiry, demand windows) receives the clock as a parameter so tests control time.
- Tasks: at most 10, in dependency order, each small enough for one implementer run and each with a verifiable "Done when" that names the check from the "Verification" table in `AGENTS.md`.
- `tasks.md` is the shared board: set `Owner` and `Status` before starting a task, so teammates and agents do not repeat work. Tasks with an empty `Depends on` can run in parallel.
- Do not edit someone else's `Owner` field; ask them.
