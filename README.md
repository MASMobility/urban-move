# UrbanMove

Distributed urban mobility system (bicycles and scooters), **100% serverless on AWS**. Final project of Cloud
Computing (ULPGC).

The architecture is **stateless serverless microservices**: each service is a set of Lambdas with its own
storage, none of them keeps state between invocations (what must be remembered lives in DynamoDB or S3), and
services talk to each other through APIs or events. The full rules are in `AGENTS.md`.

```
frontend/         Astro + Tailwind client apps: users, maintenance/operations and dashboard.
backend/          Java Lambdas, one Maven module per microservice, and the registry functions.json.
db/               The data model: tables per service, data ownership, Data Lake and data marts.
infrastructure/   Terraform. It walks backend/functions.json to create Lambdas, routes and IAM.
docs/             Architecture decision records (docs/adr/), diagrams and contracts.
```

Every folder has its own README so it can be shown on its own.

## Prerequisites

The whole team must have the same versions. Check with the commands in the last column.

| Tool | Version | What for | Install (Windows / macOS / Linux) | Check |
|---|---|---|---|---|
| Git | >= 2.40 | version control | `winget install Git.Git` / `brew install git` / `apt install git` | `git --version` |
| JDK | 21 (Temurin) | Java Lambdas, Gatling | `winget install EclipseAdoptium.Temurin.21.JDK` / `brew install --cask temurin@21` / `apt install openjdk-21-jdk` | `java -version` |
| Maven | *do not install* | use the wrapper `./mvnw` (`mvnw.cmd` on Windows) committed in each module | n/a | `./mvnw -v` |
| Terraform | >= 1.9 | infrastructure as code | `winget install Hashicorp.Terraform` / `brew install terraform` / see releases.hashicorp.com | `terraform -version` |
| AWS CLI | v2 | credentials and manual tests | `winget install Amazon.AWSCLI` / `brew install awscli` | `aws --version` |
| Node.js | >= 22.20 | frontend (Astro) and skills CLI | `winget install OpenJS.NodeJS.LTS` / `brew install node` | `node -v` |
| Python | >= 3.10 | diagram skill and `scripts/check_harness.py` | `winget install Python.Python.3.12` / `brew install python` | `python --version` |
| OpenCode **or** Claude Code | latest | AI agents (either one is enough) | see [opencode.ai](https://opencode.ai) and [code.claude.com](https://code.claude.com/docs) | `opencode --version` / `claude --version` |

Python: `python -m pip install -r requirements.txt` (on Windows `python` instead of `python3`).

## Credentials

Never in the repo (the LocalStack token, `LOCALSTACK_AUTH_TOKEN`, neither: environment variables only). Use
`aws configure sso`, environment variables or `~/.aws/credentials` (in AWS Academy they are copied from *AWS
Details* and expire with the session). `*.tfvars`, `*.tfstate` and `.env` are in `.gitignore`.

## AI agents (Claude Code and OpenCode)

- `AGENTS.md`: project instructions (OpenCode reads it; `CLAUDE.md` imports it for Claude Code).
- `.claude/skills/`: versioned skills. Claude Code **and** OpenCode read this path natively, so there are no
  symlinks or copies (it works the same on Windows).
- Every third-party skill includes `LICENSE` and `PROVENANCE.md` (origin, commit and local changes). Always
  review its `SKILL.md` and scripts before adding a new one.
- SDD agents (coordinator, planner, implementer, reviewer) to work from a written spec (`specs/NNN-name/`,
  skill `sdd`). The prompts live once in `.opencode/prompts/`.

| Tool | Where the agents are defined | How to launch the coordinator |
| --- | --- | --- |
| OpenCode | `opencode.jsonc` (personal config and keys go in `opencode.json`, ignored by git) | **Tab** key until `coordinator` |
| Claude Code | `.claude/agents/` | `claude --agent coordinator` |

`MEMORY.md` is the shared memory (at most 200 lines, lines are only appended at the end; `.gitattributes` makes
the additions of two people merge without conflict on `git merge` or `git pull`. GitHub's *Merge* button does
not use that rule: if a conflict shows up, resolve it by hand keeping both lines).

Harness checks (CI runs them too, in `.github/workflows/harness.yml`):

```bash
python scripts/check_harness.py                                    # skills, agents and config are consistent
node .claude/skills/functions-registry/scripts/functions.mjs check # functions.json valid and README up to date
node --test .claude/skills/functions-registry/scripts/             # tests of the validator
```

## Architecture decisions

See [docs/adr/](docs/adr/README.md). Open questions and deferred work are in `MEMORY.md`.
