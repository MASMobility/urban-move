# backend/README.md

Title: `# backend — UrbanMove Lambdas`. Opening: how many microservices (modules `backend/<service>/`),
language and runtime (Java 21), and what is not there (heavy frameworks, in-memory state...). Do not state the
number of functions: the generated table does.

Sections:

1. **Run locally**: build with the Maven Wrapper (`./mvnw`), run the tests, and how a Lambda is tried without
   deploying (whatever is decided: SAM local, LocalStack, handler tests). Environment variables.
2. **Functions** — *generated block*. `sync` creates this section with four tables (HTTP routes, event-driven
   functions, permissions, events). Do not edit them. Below, one sentence: "The live list is in
   `functions.json`, which packaging and Terraform consume".
3. **Structure**: tree of a typical service module (`handler/`, `domain/`, `repository/`, `events/`) with the
   layering rule ("handlers know nothing about the database and the domain knows nothing about HTTP").
4. **Resource lifecycle**: table of states (`AVAILABLE`, `RESERVED`, `IN_USE`, `LOW_BATTERY`, `WITHDRAWN`,
   `CHARGING`, `REPAIRING`, `READY_FOR_SERVICE`, `RETIRED`) with `From | Event | To | Service that validates the
   transition`. Section 5 of the statement asks for it.
5. **Decisions not to undo**: for example how double reservation of the same resource is avoided (conditional
   write), idempotency when reprocessing events, correlationId in every event. Each with its why.
6. **Events**: common format (id, timestamp, origin, type, schema version, correlationId) and where the schemas
   are. The table of producers and consumers is the generated one.
7. **Observability**: structured logs with correlationId, which metrics are emitted (table `Metric | Unit |
   Dimension | Where`), and the rule on dimension cardinality.
8. **Fault tolerance**: retries, DLQ, graceful degradation; link the ADR or the tested scenario.
9. **Packaging**: where each jar ends up and which handler it carries.
10. **Pending**.

Source: `backend/functions.json`, `pom.xml`, handler code, ADRs in `docs/adr/`.
