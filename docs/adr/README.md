# Architecture decisions (ADRs)

Each ADR records a problem, the alternatives, the decision and its consequences. They are created with the
`write-adr` skill. Once accepted, an ADR is not rewritten: if the decision changes, another one is created that
supersedes it.

| No. | Decision | Status | Date |
| --- | --- | --- | --- |
| [0001](0001-define-infrastructure-with-terraform-on-localstack-and-aws.md) | Define the infrastructure with Terraform and test it locally on LocalStack before AWS | Accepted | 2026-10-24 |
| [0002](0002-keep-terraform-state-local-per-person.md) | Each person keeps the Terraform state locally | Accepted | 2026-10-24 |
| [0003](0003-use-one-lambda-per-handler.md) | One Lambda per handler | Accepted | 2026-10-24 |
