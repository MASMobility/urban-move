# README.md (root)

The front door: what the project is, how to run it and where everything is. It does not explain layer
decisions (each folder does).

Sections, in this order (skip the ones that do not apply yet):

1. **Title and opening paragraph.** What UrbanMove is, that it is the final project of Cloud Computing, and that
   it is 100% serverless on AWS.
2. **Folder map** in a code block, one line per folder (`frontend/`, `backend/`, `db/`, `infrastructure/`,
   `docs/`), and one sentence: every folder has its own README so it can be shown on its own.
3. **Prerequisites** (the version table already exists; keep it up to date) and **Credentials** (never in the repo).
4. **Run locally**: the minimal, reasonable flow of commands (the statement asks for a single one). Include
   the table of real commands: install, run, test, package, deploy, destroy.
5. **The boundaries of the project**: the interfaces that allow swapping what is behind them (for example, the
   frontend's HTTP client versus a mock, or the data repository versus an in-memory one).
   Table `Interface | Separates | Today | Later`.
6. **Demo flows**: the five of the statement (user, maintenance, analytics and relocation, dashboard,
   controlled failure), each with the commands or steps to reproduce it.
7. **Pipeline**: what CI runs on every change (tests, format, images or artifacts, `functions.mjs check`).
8. **AI agents**: `AGENTS.md`, `.claude/skills/` (already there).
9. **Before showing it / Pending**: table `What | Status` with priority.
10. **Work split**: who did what (the PDF asks for it; here or linked from the PDF).

Source of each fact: `package.json`/`pom.xml`/Terraform for commands and versions; `git log` for the split.
