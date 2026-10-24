# db — the data model

Every microservice with state has its **own DynamoDB table**, and the event Data Lake lives in S3. This README
holds the why of each decision. For now `db/` only contains this README: keys and seeds will be added as each
service is written (see "Pending").

## The starting point

In DynamoDB the model does not come from the entities: it comes from the **queries**. Before fixing a key, the
access patterns of each service (the methods its handlers need) are written down, and the table is designed so
that each one is a `GetItem` or a `Query`, never a `Scan`. The list of functions and the data each one touches
is in `backend/functions.json` (field `uses`); the summary is in `backend/README.md`.

## Data ownership

Every table has a single owning service. Nobody reads or writes another's table: services communicate through
APIs or events (rule of `AGENTS.md`).

| Table | Owning service | What it stores |
| --- | --- | --- |
| `identity-users` | identity | credentials and role (user, maintenance, admin) |
| `profiles` | profiles | user data and preferences, with soft delete |
| `zones` | zones | zones, parking restrictions and simplified geographic metadata |
| `inventory` | inventory | assets: type, model, purchase date and administrative status |
| `acquisitions` | acquisitions | purchases and incorporations of resources |
| `availability` | availability | operational state of each resource (what can be reserved now) |
| `telemetry` | telemetry | battery, last location and uses since the last inspection |
| `reservations` | reservations | reservations and their expiry |
| `rides` | rides | rides: origin, destination, duration and preliminary cost |
| `incidents` | incidents | breakdowns, vandalism, blockages and missing resources |
| `maintenance-orders` | maintenance | maintenance orders and their tasks |
| `relocation-orders` | relocation | relocation orders between zones |
| `history` | history | history of reservations, rides, incidents and maintenance |
| `notifications` | notifications | notification inbox |
| `analytics-marts` | analytics | the data marts served to the dashboard |
| bucket `datalake` | datalake | events in `raw/` and `trusted/` |

Two accesses that do not follow "one table, one service", and why:

- **`analytics` reads the `datalake` bucket**, which belongs to `datalake`. It is by design: the Data Lake
  exists so that analytics builds the data marts from it, and `analytics` only reads it.
- **`analytics-health` and the failed-event functions** read the dead-letter queues (DLQ) and CloudWatch
  metrics; those are not any service's data.

## Data Lake

Microservices never use the Data Lake as a transactional database: it collects events for analytics, audit and
data marts.

| Layer | Written by | Content |
| --- | --- | --- |
| `raw/` | `datalake-ingest` | every event as it arrives, partitioned by date, type and producing service |
| `trusted/` | `datalake-promote-to-trusted` | validated and normalized events; what fails the schema is set aside |
| `curated/` | — | unused for now (see "Pending") |

Planned partitioning: `raw/year=YYYY/month=MM/day=DD/source=<service>/` and `trusted/event_type=<Event>/`.
`analytics-build-marts` is triggered by what is new in `trusted/`.

## Data marts

They are built incrementally by `analytics-build-marts` (and can be recomputed by window with
`analytics-rebuild-marts`) and queried with `GET /analytics/marts/{mart}`.

| Data mart | Question it answers |
| --- | --- |
| `users` | How many active users are there per period? Who has the most rides or cancellations? |
| `reservations` | How many reservations expire? In which zones are resources reserved and then not used? |
| `rides` | What are the most frequent origins and destinations? What is the average ride duration? |
| `fleet` | How many resources are available, in use, charging or under repair per zone? |
| `maintenance` | Which resources need recharging or repair? How long are they out of service? |
| `operations` | Which relocation orders are created, how many are completed and with what delay? |
| `demand` | Which zones have a deficit or excess of resources by time slot and vehicle type? |

**The `demand` data mart is the one that decides a relocation.** Every 5 minutes `analytics-detect-hotspots`
reads it: if a zone has fewer than 3 available resources and more than 10 reservation attempts or started rides
in the last hour, it emits `DemandHotspotDetected`; `relocation-propose` reacts by creating the relocation order.

## Pending

- **Keys of each table** (`PK`, `SK`, indexes, TTL): fixed from the access patterns of each service. It is
  already known that `reservations` will need to look up reservations by expiry (`reservations-expire` runs
  every minute) and that double-booking control will use a conditional write.
- **Access-pattern table** per service (method -> DynamoDB operation).
- **Where the data marts are served:** today DynamoDB is planned (`analytics-marts`) and `curated/` stays
  unused. If S3 plus queries is preferred, it is a decision for an ADR.
- **Initial load:** zones, resources and demo users, with their command and their reset. There are no scripts in
  `db/` yet.
