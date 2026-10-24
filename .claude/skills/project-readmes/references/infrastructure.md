# infrastructure/README.md

Title: `# infrastructure — deployment with Terraform`. Opening: which environment is the target (see the ADR on
the environment) and why.

Sections:

1. **Modules**: table `Module | What it creates | When it is deployed`. Separate what survives redeploys (tables,
   Data Lake) from what changes daily (Lambdas), and say why.
2. **Before anything**: credentials (`aws configure sso` or the Academy ones, which expire), Terraform state,
   required variables. No real values.
3. **Deploy**: real commands in order (`terraform init/plan/apply`, prior packaging, seeds) and what each
   prints in the outputs (URLs, names).
4. **How it is built**: tree of the folder and the key sentence: "Terraform **does not list the Lambdas**: it
   walks `backend/functions.json`; adding a function is adding an entry there" (skill `functions-registry`).
5. **Events and queues**: bus, queues, DLQ, retries and the retention policy.
6. **Observability**: log groups with retention, dashboard, alarms (with which metric and why) and where they
   are seen.
7. **Scaling**: reserved concurrency, parallelism of the event Lambdas, Data Lake partitioning.
8. **Conscious simplifications**: what would be done differently in production (for example the shared
   `LabRole` in Academy instead of one role per function).
9. **Clean up**: `terraform destroy` and what takes long or is left behind. It must contain what section 17 of
   the statement requires: **resources created, deleted and still active, expected cost and measures to avoid
   exposing credentials**. Keep it up to date at every real deployment.
10. **Pending**.

Source: `.tf` files, `terraform output`, `backend/functions.json`, ADRs in `docs/adr/`.
