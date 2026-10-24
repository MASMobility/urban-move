---
name: write-adr
description: "Writes and maintains the UrbanMove ADRs (architecture decision records) in docs/adr/, with problem, alternatives, decision and consequences, as the course statement requires (at least two). Use it when an architecture decision is taken or changed (event bus, database, Java cold start, AWS Academy vs LocalStack, double-reservation strategy...), when the user asks for an ADR, or when documenting why something is built a certain way."
---

# UrbanMove ADRs

An ADR is a **short** document that records an architecture decision: what the problem was, which options were
looked at, which one was chosen and what it costs. The course statement requires at least two and asks for
them with that structure (*problem, alternatives, decision and consequences*). In the defense every "why" is
asked: the ADR is the prepared answer, linked to the real code. ADRs are written in English.

## When to write one

Write an ADR if the decision:
- affects structure, interfaces between services or a quality attribute (failures, cost, scale), and
- is expensive to reverse, or someone arriving later will ask "why like this?", and
- had real alternatives with advantages and drawbacks.

Do not write one for code style (the linter covers it), a local detail of a single handler or a temporary
workaround. If in doubt: would you defend it in the defense with one sentence? Then it probably deserves an ADR.

## Where and what it is called

- Folder `docs/adr/`. File `NNNN-verb-phrase.md`, lowercase with hyphens:
  `0001-use-sqs-and-eventbridge-as-bus.md`. `NNNN` is the next free number (look in `docs/adr/`).
- Index `docs/adr/README.md`: table `No. | Decision | Status | Date`. Create it with the first ADR and
  update it in the same change as any new ADR or status change.
- One ADR, one decision. If two come out, they are two files that link to each other.

## Process

1. **Understand the decision.** If it is not clear from the code, the chat or `git log`, **ask** the user what
   was decided and why. Do not invent a decision or a reason: if it is only a proposal, the status is `Proposed`.
2. **Gather real evidence.** Open the affected files (`infrastructure/`, `backend/functions.json`, `db/`).
   Every claim about the system must be checkable there; figures (cost, latency, AWS Academy limits) carry a
   unit and an origin, or are marked as estimates.
3. **Copy `template.md`** to `docs/adr/NNNN-...md` and fill it in. See `example.md` for the level of detail.
4. **Honest alternatives.** At least two, the chosen one included, with real pros and cons. A straw-man
   alternative does not count. Include "do nothing" when it applies.
5. **Consequences with drawbacks.** Write down the bad: cost, debt, risks and how they are watched.
6. **Link to the code.** The section "Where it shows in the code" names real files (Terraform module,
   `functions.json` function, `db/` table). The defense asks to relate decision and repository.
7. **Update the index** and, if the ADR changes what a README says, that README (skill `project-readmes`).

## Rules

- **Once `Accepted`, it is not rewritten.** If the decision changes, create a new ADR, set the old one to
  `Superseded by ADR-NNNN` and link both.
- Present tense and direct voice ("We use SQS in front of every consumer"), at most one page.
- Date: today's, as `YYYY-MM-DD`. Authorship: who decided, by name.
- No credentials, account IDs or real ARNs.

## Candidates for this project

Decisions the statement forces and that will be defended. **They are topics, not decisions taken:** ask the
team before writing.

| Topic | Typical alternatives | What it touches |
|---|---|---|
| Event bus and queues | EventBridge + SQS per consumer, SNS + SQS, Kafka | `functions.json` (`consumes`), `infrastructure/` |
| Where everything runs and is deployed | AWS Academy, real AWS, LocalStack | everything; conditions IAM (`LabRole`) |
| One Lambda per route or per service | one per handler, one per microservice | `functions.json`, packaging |
| Java cold start | SnapStart, Micronaut/GraalVM, more memory | `backend/`, `memoryMb` |
| Avoiding double reservation | conditional write, lock, FIFO queue | `reservations-create`, `db/` |
| Data: table per service vs single table | DynamoDB per service, shared table | `db/`, data ownership |
| Data marts: where they are served | DynamoDB, S3 + Athena | `analytics-*`, `db/` |
| Reprocessing failed events | DLQ + manual redrive, automatic retries | `analytics-replay-failed-events` |
| Authentication | own Lambda authorizer, Cognito | `identity-authorize` |
