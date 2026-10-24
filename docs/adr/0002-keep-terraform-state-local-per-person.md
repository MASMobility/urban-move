# ADR-0002: Each person keeps the Terraform state locally

- **Status:** Accepted
- **Date:** 2026-10-24
- **Decided by:** UrbanMove team (decision communicated by Marcial; the rest of the team reviews it in the PR)
- **Related:** ADR-0001, `.gitignore`

## Problem

Three people deploy the same infrastructure. The Terraform state (`*.tfstate`) cannot go to git: it contains
identifiers and possibly secrets. We must decide how to manage it without adding extra infrastructure.

## Alternatives

### A. Local state per person
- **Pros:** the simplest, nothing to coordinate or create before starting. Since the infrastructure comes from
  the repo code, everyone gets the same structure in their own environment (LocalStack or their Academy session).
- **Cons:** each person only sees what they deployed. If two people apply to the same account, resource names
  can collide, and if someone loses their local state it leaves orphan resources.

### B. Shared S3 bucket with locking
- **Pros:** everyone sees the same state and they lock each other out.
- **Cons:** in Academy credentials and resources may disappear when the lab restarts, and the bucket must be
  created before Terraform can be used.

### C. HCP Terraform (free remote state)
- **Pros:** remote state with locking outside AWS.
- **Cons:** an external account per person and another tool to learn; `apply` still needs AWS credentials.

### D. A single person deploys
- **Pros:** no state conflicts.
- **Cons:** a bottleneck on that person.

## Decision

Each person generates their own state locally (on LocalStack or in their AWS Academy session). The
infrastructure is reproducible from the repository code, so everyone has the same structure; what is shared is
the Terraform code, not the state.

## Consequences

- **Good:** no extra infrastructure or coordination, and consistent with ADR-0001 (each one works in their own
  environment).
- **Bad:** the state is not shared, and Terraform changes are integrated through git, so merges need attention.
- **Risks and how they are watched:** in a shared Academy account, duplicate names between people (proposed
  mitigation: a per-person or per-environment prefix in resource names); and orphan resources if a state is lost
  (mitigation: in Academy the lab is cleaned when it restarts). `.terraform.lock.hcl` is versioned so everyone
  uses the same provider versions.

## Where it shows in the code

- `.gitignore`: ignores `*.tfstate`, `*.tfstate.*` and `*.tfvars`.
- `infrastructure/`: will have a prefix or environment variable for resource names.
