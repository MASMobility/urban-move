# ADR-0001: Define the infrastructure with Terraform and test it locally on LocalStack before AWS

- **Status:** Accepted
- **Date:** 2026-10-24
- **Decided by:** UrbanMove team (decision communicated by Marcial; the rest of the team reviews it in the PR)
- **Related:** ADR-0002, `AGENTS.md` (architecture), `infrastructure/README.md`

## Problem

The project must be developable and testable without depending on the cloud and, when needed, deployable to
AWS without rewriting the infrastructure. AWS Academy limits sessions and does not allow creating IAM roles
(only using `LabRole`). The team wants to isolate the dependency on AWS: what is used locally must work as is
in the cloud.

## Alternatives

### A. Terraform with LocalStack locally and AWS (Academy or real) in the cloud, with the same code
- **Pros:** development and tests do not spend Academy sessions or money; one infrastructure code for both
  targets (reproducible by anyone who clones the repo); fits the local version the statement asks for.
- **Cons:** LocalStack no longer offers a free edition without an account: every person needs an account and a
  token. According to its licensing documentation, API Gateway v2 (HTTP API) is not in the Hobby plan
  (non-commercial use) and is in the Student plan (verified GitHub Education account) and the paid ones. Two
  targets to maintain.

### B. AWS Academy only
- **Pros:** a real cloud and no emulator to maintain.
- **Cons:** sessions expire, IAM roles cannot be created and every test spends lab time.

### C. Real AWS only (own account)
- **Pros:** no Academy limits and one IAM role per function.
- **Cons:** may generate cost (card and budget to watch) and resources must be cleaned up at the end to meet
  section 17 of the statement.

### D. Another emulator instead of LocalStack (for example moto or Floci)
- **Pros:** may not require an account or token.
- **Cons:** their coverage of the services the design uses (API Gateway, Lambda, EventBridge, SQS, DynamoDB,
  S3, Step Functions) has not been checked; the statement mentions LocalStack explicitly.

## Decision

Terraform is the only definition of the infrastructure. It is deployed first to LocalStack to develop and test,
and to AWS (Academy or real) when needed, **with the same code**: what changes is the target (the provider
configuration), not the resources.

## Consequences

- **Good:** development without depending on the cloud, infrastructure reproducible from the repository, and the
  AWS dependency isolated in Terraform.
- **Bad:** each person needs a LocalStack account and token (in an environment variable, never in the repo), and
  Terraform will have to isolate what differs between targets, such as `LabRole` in Academy.
- **Risks and how they are watched:**
  - If the plan the team has does not include API Gateway v2, the current design (HTTP API and authorizer) will
    not run locally as is. It is checked before writing the first Terraform module; the ways out are the Student
    plan, an API Gateway v1 REST API or another emulator, and any of them would be documented in a new ADR.
  - EventBridge and the rest of the services are verified one by one in Academy and in LocalStack.

## Where it shows in the code

- `infrastructure/`: the Terraform, once it exists, with a variable that chooses the target.
- `backend/functions.json`: what Terraform walks to create the Lambdas, the same on both targets.
