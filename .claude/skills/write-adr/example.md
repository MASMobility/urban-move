> **EXAMPLE to calibrate the level of detail. It is not a decision taken by the team.**
> Do not copy it to `docs/adr/` unless the team has really decided this.

# ADR-0001: Use one SQS queue per consumer behind an event bus

- **Status:** Proposed
- **Date:** 2026-10-24
- **Decided by:** (team names)
- **Related:** `backend/README.md` (Events section), `backend/functions.json` (`sqs` triggers)

## Problem

Reservations, rides and maintenance emit events that history, notifications, availability and the Data Lake
consume. If a consumer goes down, the producer must not fail or lose the event, and the event must be
replayable. The environment only offers serverless services.

## Alternatives

### A. Producers invoke consumers directly (HTTP or Lambda)
- **Pros:** simple, no extra infrastructure.
- **Cons:** couples services; if history is down, the ride fails or the event is lost; no retries.

### B. EventBridge to one SQS queue per consumer, each with its DLQ
- **Pros:** decouples producers and consumers; each consumer scales and fails on its own; native retries and
  DLQ.
- **Cons:** more resources to declare; at-least-once delivery (consumers must be idempotent); EventBridge
  availability in Academy must be checked.

### C. Kafka (MSK)
- **Pros:** powerful ordering and replay.
- **Cons:** not truly serverless, high fixed cost, disproportionate for this volume.

## Decision

We use B: an EventBridge bus and one SQS queue with a DLQ per consumer. It best covers decoupling, retries and
replay without leaving serverless.

## Consequences

- **Good:** a history failure does not affect reserving or riding; failed events stay in the DLQ and can be
  resent.
- **Bad:** at-least-once delivery means every consumer must be written idempotently (by `eventId`).
- **Risks and how they are watched:** a DLQ filling up unnoticed; its depth is shown in
  `GET /analytics/health`.

## Where it shows in the code

- `backend/functions.json`: the functions with `trigger.type = "sqs"` and their `consumes`.
- `infrastructure/`: the bus rule and one queue with a DLQ for each `queue` of the registry.
