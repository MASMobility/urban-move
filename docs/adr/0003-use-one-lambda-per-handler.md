# ADR-0003: One Lambda per handler

- **Status:** Accepted
- **Date:** 2026-10-24
- **Decided by:** UrbanMove team (decision communicated by Marcial; the rest of the team reviews it in the PR)
- **Related:** `backend/functions.json`, `backend/README.md` (generated tables)

## Problem

We must decide how the code of each microservice is split into Lambda functions. A **handler** is the Java
class and method that Lambda runs (the entry point of the function). It is not the same as an endpoint: an
endpoint is an HTTP route, and many handlers have no route because they are triggered by a queue, a scheduled
task, a new file in S3, or API Gateway as an authorizer. At the date of this ADR the registry has 66 handlers:
50 with an HTTP route, 11 that consume a queue, 2 scheduled, 2 that react to S3 and 1 authorizer.

## Alternatives

### A. One Lambda per handler
- **Pros:** least-privilege IAM per function (the one that only reads cannot write), independent scaling and
  failures per function, and it is what `functions.json` already models.
- **Cons:** more resources to declare and deploy, and more Java cold starts (each function starts its own
  environment).

### B. One Lambda per microservice, with an internal router
- **Pros:** far fewer Lambdas and fewer cold starts.
- **Cons:** IAM is that of the whole service (more permissive), a failure or a load spike affects all its
  routes, and the registry and the generated tables would have to be redone.

### C. Mixed (per service for HTTP, per handler for events)
- **Pros:** fewer cold starts on user routes and isolation where it matters.
- **Cons:** two patterns to maintain and a registry that would have to model both.

## Decision

One Lambda per handler. It is chosen for scalability and isolation: each function scales, fails and has its
permissions separately.

## Consequences

- **Good:** least privilege per function and independent scaling; a single deployment code (Terraform walks the
  registry).
- **Bad:** many resources and many jars; the Java startup time is paid per function.
- **Risks and how they are watched:** a cold start is not just "the first customer". Lambda creates one
  environment per concurrent request and shuts down those that have been idle for a while, so each function can
  cold start several times and a flow that goes through several functions can suffer it in each one. It is
  mitigated with Java without heavy frameworks, more memory or SnapStart, and measured in the load tests
  (Gatling). If the latency of user routes is not acceptable, it is revisited with a new ADR (alternative C).

## Where it shows in the code

- `backend/functions.json`: one entry per handler, with its `entry` and its `handler`.
- `backend/<service>/`: one Maven module per microservice with several handlers.
