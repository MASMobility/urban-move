# db/README.md

Title: `# db — the data model`. Opening: which stores exist (DynamoDB per service, S3 for the Data Lake) and
where the executable implementation is (keys, schemas). A mini tree of `db/`.

Sections:

1. **The starting point**: in DynamoDB the model comes from the **queries**, not from the entities. List the
   access patterns (the methods of the repositories) before describing tables.
2. **Data ownership**: table `Table | Owning service | What it stores`. It is the "data ownership table" the
   statement requires; no service writes to another's table.
3. **Tables**: per table, `PK | SK | Entity`, indexes (GSI) and TTL.
4. **Each pattern, its operation**: table `# | Method | Operation (GetItem/Query/TransactWrite...) | Note`.
   Point out where conditions are used to guarantee uniqueness or idempotency (for example reservations).
5. **The N decisions that matter**: each with a numbered title, the problem and why this solution and not the
   alternative (why a GSI, why a pointer item, why conditions instead of `if`).
6. **Data Lake**: layers `raw/`, `trusted/`, `curated/`, partition scheme (`year=/month=/day=/source=`) and
   how an event gets there.
7. **Data marts**: table `Data mart | Domain | Question it answers | Built with`, and an example query or
   indicator for each. Mark which one feeds the relocation decision.
8. **What was left half-done on purpose**: known limits (avoided Scans, in-memory aggregations...).
9. **Initial load**: how data is seeded and reset (real commands).

Source: code in `db/`, repositories in `backend/`, `functions.json` (`uses`) to know who touches which table.
