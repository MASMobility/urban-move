# backend

## Functions

Generated from `functions.json` (`node .claude/skills/functions-registry/scripts/functions.mjs sync`). Do not edit by hand.

### HTTP routes

<!-- functions:routes:start -->
| Method | Route | Function | Service | Who | Status | What it does |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/auth/register` | `identity-register` | identity | public | planned | Registers credentials with the user role and emits UserRegistered; the profiles service creates the profile. |
| POST | `/auth/login` | `identity-login` | identity | public | planned | Checks the credentials and returns a signed session token carrying the account role. |
| GET | `/auth/me` | `identity-me` | identity | user, maintenance, admin | planned | Returns the identity and role of the current session. |
| POST | `/auth/staff` | `identity-create-staff` | identity | admin | planned | Creates a maintenance or admin account; only an admin can request it. |
| GET | `/profiles/me` | `profiles-get-me` | profiles | user | planned | Reads the profile and preferences of the authenticated user. |
| PUT | `/profiles/me` | `profiles-update-me` | profiles | user | planned | Updates the user's data and preferences, with basic validation. |
| DELETE | `/profiles/me` | `profiles-deactivate-me` | profiles | user | planned | Soft-deletes the user: keeps the history and stops accepting reservations. |
| GET | `/zones` | `zones-list` | zones | user, maintenance, admin | planned | Lists the operating zones with their parking restrictions. |
| GET | `/zones/{zoneId}` | `zones-get` | zones | user, maintenance, admin | planned | Returns one zone: simplified boundaries, supported resource types and capacity. |
| PUT | `/zones/{zoneId}` | `zones-put` | zones | admin | planned | Creates or updates a zone in the catalog. |
| GET | `/vehicles` | `inventory-list` | inventory | maintenance, admin | planned | Lists assets, filterable by type, model and administrative status. |
| GET | `/vehicles/{vehicleId}` | `inventory-get` | inventory | maintenance, admin | planned | Asset record: type, model, purchase date and administrative status. |
| POST | `/vehicles/{vehicleId}/retire` | `inventory-retire` | inventory | admin | planned | Permanently retires a resource (RETIRED). |
| POST | `/acquisitions` | `acquisitions-register` | acquisitions | maintenance, admin | planned | Registers the purchase or incorporation of new resources and emits one VehiclePurchased per resource. |
| GET | `/acquisitions` | `acquisitions-list` | acquisitions | maintenance, admin | planned | Lists the registered acquisitions. |
| GET | `/availability` | `availability-list` | availability | user, maintenance, admin | planned | Resources that can be reserved now, filterable by zone and type (user query). |
| GET | `/availability/{vehicleId}` | `availability-get` | availability | user, maintenance, admin | planned | Operational state of one resource; reservations and rides check it before acting. |
| GET | `/availability/summary` | `availability-summary` | availability | maintenance, admin | planned | Real-time count of resources by state, zone and type. |
| POST | `/telemetry/readings` | `telemetry-record` | telemetry | admin | planned | Receives a simulated reading (battery, location, km) and emits VehicleBatteryLow if it drops below the threshold. |
| GET | `/telemetry/attention` | `telemetry-list-attention` | telemetry | maintenance, admin | planned | Resources with low battery, anomalous usage or a pending inspection (maintenance query). |
| POST | `/reservations` | `reservations-create` | reservations | user | planned | Reserves an available resource with a conditional write so it cannot be reserved twice, and emits VehicleReserved. |
| POST | `/reservations/{reservationId}/confirm` | `reservations-confirm` | reservations | user | planned | Confirms a pending reservation before it expires. |
| POST | `/reservations/{reservationId}/cancel` | `reservations-cancel` | reservations | user | planned | Cancels a user's reservation and releases the resource. |
| GET | `/reservations/{reservationId}` | `reservations-get` | reservations | user | planned | Reads one of the caller's own reservations. |
| POST | `/rides` | `rides-start` | rides | user | planned | Starts a ride on a reserved or available resource and emits RideStarted. |
| POST | `/rides/{rideId}/finish` | `rides-finish` | rides | user | planned | Finishes the ride in the destination zone, computes duration and preliminary cost and emits RideFinished. |
| GET | `/rides/{rideId}` | `rides-get` | rides | user, admin | planned | Reads a ride: origin, destination, duration and cost. |
| POST | `/incidents` | `incidents-report` | incidents | user, maintenance | planned | Registers a breakdown, vandalism, blockage or missing resource, and emits IncidentReported. |
| GET | `/incidents` | `incidents-list` | incidents | maintenance, admin | planned | Lists incidents, filterable by status, type and resource. |
| GET | `/maintenance-orders` | `maintenance-list-orders` | maintenance | maintenance, admin | planned | Lists maintenance orders, filterable by status (open, in progress, completed). |
| GET | `/maintenance-orders/{orderId}` | `maintenance-get-order` | maintenance | maintenance, admin | planned | Detail of an order with its tasks. |
| POST | `/maintenance-orders/{orderId}/assign` | `maintenance-assign` | maintenance | maintenance, admin | planned | Assigns an order to a maintenance person. |
| POST | `/maintenance-orders/{orderId}/withdraw` | `maintenance-withdraw` | maintenance | maintenance, admin | planned | Takes the resource off the public street and emits VehicleWithdrawnForMaintenance. |
| POST | `/maintenance-orders/{orderId}/tasks` | `maintenance-start-task` | maintenance | maintenance, admin | planned | Records the start of a recharge, repair or inspection task. |
| POST | `/maintenance-orders/{orderId}/tasks/{taskId}/complete` | `maintenance-complete-task` | maintenance | maintenance, admin | planned | Finishes a task and leaves the resource ready to go back on the street. |
| POST | `/maintenance-orders/{orderId}/return-to-service` | `maintenance-return-to-service` | maintenance | maintenance, admin | planned | Puts the resource back into service, closes the order and emits VehicleReturnedToService. |
| GET | `/relocation-orders` | `relocation-list-orders` | relocation | maintenance, admin | planned | Lists relocation orders, filterable by status. |
| POST | `/relocation-orders/{orderId}/assign` | `relocation-assign` | relocation | maintenance, admin | planned | Marks an order as assigned. |
| POST | `/relocation-orders/{orderId}/start` | `relocation-start` | relocation | maintenance, admin | planned | Marks an order as in progress. |
| POST | `/relocation-orders/{orderId}/complete` | `relocation-complete` | relocation | maintenance, admin | planned | Marks an order as completed and emits RelocationOrderCompleted. |
| GET | `/history/me` | `history-list-mine` | history | user | planned | Personal history of the user's reservations and rides. |
| GET | `/history/vehicles/{vehicleId}` | `history-list-vehicle` | history | maintenance, admin | planned | History of one resource: rides, incidents, maintenance and relocations. |
| GET | `/history/correlations/{correlationId}` | `history-trace` | history | maintenance, admin | planned | Returns all the events of a flow by its correlationId, to diagnose end to end. |
| GET | `/notifications` | `notifications-list-mine` | notifications | user, maintenance, admin | planned | Notification inbox of the caller. |
| POST | `/analytics/marts/rebuild` | `analytics-rebuild-marts` | analytics | admin | planned | Recomputes the data marts of a given time window, in case a failure left them incomplete. |
| GET | `/analytics/marts/{mart}` | `analytics-get-mart` | analytics | maintenance, admin | planned | Queries one data mart (users, reservations, rides, fleet, maintenance, operations, demand) with zone, type and window filters. |
| GET | `/analytics/dashboard` | `analytics-dashboard` | analytics | maintenance, admin | planned | Summary for the dashboard's first paint: fleet by state, reservations and rides per time slot, zones with deficit or excess, open orders. |
| GET | `/analytics/health` | `analytics-health` | analytics | maintenance, admin | planned | System health: recent errors per function and pending failed events. |
| GET | `/analytics/failed-events` | `analytics-failed-events` | analytics | admin | planned | Lists the events that ended up in a dead-letter queue, with their correlationId. |
| POST | `/analytics/failed-events/replay` | `analytics-replay-failed-events` | analytics | admin | planned | Sends the events of a dead-letter queue back to their origin queue so they are reprocessed. |
<!-- functions:routes:end -->

### Event-driven and scheduled functions

<!-- functions:triggers:start -->
| Function | Service | Triggered by | Consumes | Publishes | Status | What it does |
| --- | --- | --- | --- | --- | --- | --- |
| `identity-authorize` | identity | API Gateway authorizer | — | — | planned | API Gateway authorizer: validates the token once and passes the role on to the functions. |
| `profiles-on-user-registered` | profiles | SQS `profiles-events` | `UserRegistered` | — | planned | Creates the profile of a newly registered user. Idempotent by userId. |
| `inventory-on-vehicle-purchased` | inventory | SQS `inventory-events` | `VehiclePurchased` | — | planned | Registers every purchased bicycle or scooter as an asset. Idempotent by vehicleId. |
| `availability-apply-event` | availability | SQS `availability-events` | `VehiclePurchased`, `VehicleReserved`, `ReservationCancelled`, `ReservationExpired`, `RideStarted`, `RideFinished`, `VehicleBatteryLow`, `VehicleWithdrawnForMaintenance`, `MaintenanceTaskStarted`, `MaintenanceTaskCompleted`, `VehicleReturnedToService`, `VehicleRetired` | `VehicleStateChanged` | planned | Applies to the resource state machine every event that changes it, validates the transition and emits VehicleStateChanged. |
| `telemetry-on-ride-finished` | telemetry | SQS `telemetry-events` | `RideFinished` | `VehicleBatteryLow`, `VehicleInspectionDue` | planned | Subtracts battery, adds usage since the last inspection and emits VehicleBatteryLow or VehicleInspectionDue when needed. |
| `reservations-expire` | reservations | Scheduled `rate(1 minute)` | — | `ReservationExpired` | planned | Every minute releases reservations not confirmed in time and emits ReservationExpired for each one. |
| `reservations-on-ride-started` | reservations | SQS `reservations-events` | `RideStarted` | — | planned | Marks the reservation as used when the ride starts, so it does not expire in the middle of it. |
| `incidents-on-task-completed` | incidents | SQS `incidents-events` | `MaintenanceTaskCompleted` | — | planned | Closes the related incident when the maintenance task is completed. |
| `maintenance-detect` | maintenance | SQS `maintenance-events` | `VehicleBatteryLow`, `IncidentReported`, `VehicleInspectionDue` | `MaintenanceOrderCreated` | planned | Creates a maintenance order on low battery, a breakdown or too many uses since the last inspection. |
| `relocation-propose` | relocation | SQS `relocation-hotspots` | `DemandHotspotDetected` | `RelocationOrderCreated` | planned | Creates a relocation order from a zone with excess to the hotspot's deficit zone and emits RelocationOrderCreated. |
| `history-record` | history | SQS `history-events` | `UserRegistered`, `VehiclePurchased`, `VehicleReserved`, `ReservationConfirmed`, `ReservationCancelled`, `ReservationExpired`, `RideStarted`, `RideFinished`, `VehicleBatteryLow`, `IncidentReported`, `MaintenanceOrderCreated`, `VehicleWithdrawnForMaintenance`, `MaintenanceTaskStarted`, `MaintenanceTaskCompleted`, `VehicleReturnedToService`, `RelocationOrderCreated`, `RelocationOrderStatusChanged`, `RelocationOrderCompleted` | — | planned | Stores every relevant event in the history. Idempotent by eventId. |
| `notifications-send` | notifications | SQS `notifications-events` | `VehicleReserved`, `ReservationExpired`, `RideFinished`, `VehicleBatteryLow`, `IncidentReported`, `MaintenanceOrderCreated`, `RelocationOrderCreated`, `RelocationOrderCompleted` | — | planned | Simulates sending notices to users, maintenance or operations and stores them in their inbox. |
| `datalake-ingest` | datalake | SQS `datalake-ingest` | `IncidentReported`, `MaintenanceOrderCreated`, `MaintenanceTaskCompleted`, `MaintenanceTaskStarted`, `RelocationOrderCompleted`, `RelocationOrderCreated`, `RelocationOrderStatusChanged`, `ReservationCancelled`, `ReservationConfirmed`, `ReservationExpired`, `RideFinished`, `RideStarted`, `UserRegistered`, `VehicleBatteryLow`, `VehicleInspectionDue`, `VehiclePurchased`, `VehicleReserved`, `VehicleRetired`, `VehicleReturnedToService`, `VehicleStateChanged`, `VehicleWithdrawnForMaintenance` | — | planned | Copies every event as it arrives into raw/, partitioned by date, type and producing service. |
| `datalake-promote-to-trusted` | datalake | S3 `datalake/raw/` | — | — | planned | Validates and normalizes what is new in raw/ and writes it to trusted/; anything that fails the schema is set aside for review. |
| `analytics-build-marts` | analytics | S3 `datalake/trusted/` | — | — | planned | Incrementally updates the data marts (users, reservations, rides, fleet, maintenance, operations, demand) with what is new in trusted/. |
| `analytics-detect-hotspots` | analytics | Scheduled `rate(5 minutes)` | — | `DemandHotspotDetected` | planned | Every 5 minutes reads the demand data mart: a zone with fewer than 3 available resources and more than 10 reservation attempts in the last hour is a hotspot; emits DemandHotspotDetected. |
<!-- functions:triggers:end -->

### Permissions per function

<!-- functions:permissions:start -->
| Function | Data it touches | Publishes events |
| --- | --- | --- |
| `identity-register` | identity-users (DynamoDB: write) | yes |
| `identity-login` | identity-users (DynamoDB: read), identity-signing-key (Secret: read) | no |
| `identity-me` | identity-users (DynamoDB: read) | no |
| `identity-create-staff` | identity-users (DynamoDB: write) | no |
| `identity-authorize` | identity-signing-key (Secret: read) | no |
| `profiles-on-user-registered` | profiles (DynamoDB: write) | no |
| `profiles-get-me` | profiles (DynamoDB: read) | no |
| `profiles-update-me` | profiles (DynamoDB: write) | no |
| `profiles-deactivate-me` | profiles (DynamoDB: write) | no |
| `zones-list` | zones (DynamoDB: read) | no |
| `zones-get` | zones (DynamoDB: read) | no |
| `zones-put` | zones (DynamoDB: write) | no |
| `inventory-on-vehicle-purchased` | inventory (DynamoDB: write) | no |
| `inventory-list` | inventory (DynamoDB: read) | no |
| `inventory-get` | inventory (DynamoDB: read) | no |
| `inventory-retire` | inventory (DynamoDB: write) | yes |
| `acquisitions-register` | acquisitions (DynamoDB: write) | yes |
| `acquisitions-list` | acquisitions (DynamoDB: read) | no |
| `availability-list` | availability (DynamoDB: read) | no |
| `availability-get` | availability (DynamoDB: read) | no |
| `availability-summary` | availability (DynamoDB: read) | no |
| `availability-apply-event` | availability (DynamoDB: read and write) | yes |
| `telemetry-record` | telemetry (DynamoDB: read and write) | yes |
| `telemetry-list-attention` | telemetry (DynamoDB: read) | no |
| `telemetry-on-ride-finished` | telemetry (DynamoDB: read and write) | yes |
| `reservations-create` | reservations (DynamoDB: read and write) | yes |
| `reservations-confirm` | reservations (DynamoDB: read and write) | yes |
| `reservations-cancel` | reservations (DynamoDB: read and write) | yes |
| `reservations-get` | reservations (DynamoDB: read) | no |
| `reservations-expire` | reservations (DynamoDB: read and write) | yes |
| `reservations-on-ride-started` | reservations (DynamoDB: read and write) | no |
| `rides-start` | rides (DynamoDB: read and write) | yes |
| `rides-finish` | rides (DynamoDB: read and write) | yes |
| `rides-get` | rides (DynamoDB: read) | no |
| `incidents-report` | incidents (DynamoDB: write) | yes |
| `incidents-list` | incidents (DynamoDB: read) | no |
| `incidents-on-task-completed` | incidents (DynamoDB: read and write) | no |
| `maintenance-detect` | maintenance-orders (DynamoDB: read and write) | yes |
| `maintenance-list-orders` | maintenance-orders (DynamoDB: read) | no |
| `maintenance-get-order` | maintenance-orders (DynamoDB: read) | no |
| `maintenance-assign` | maintenance-orders (DynamoDB: read and write) | no |
| `maintenance-withdraw` | maintenance-orders (DynamoDB: read and write) | yes |
| `maintenance-start-task` | maintenance-orders (DynamoDB: read and write) | yes |
| `maintenance-complete-task` | maintenance-orders (DynamoDB: read and write) | yes |
| `maintenance-return-to-service` | maintenance-orders (DynamoDB: read and write) | yes |
| `relocation-propose` | relocation-orders (DynamoDB: read and write) | yes |
| `relocation-list-orders` | relocation-orders (DynamoDB: read) | no |
| `relocation-assign` | relocation-orders (DynamoDB: read and write) | yes |
| `relocation-start` | relocation-orders (DynamoDB: read and write) | yes |
| `relocation-complete` | relocation-orders (DynamoDB: read and write) | yes |
| `history-record` | history (DynamoDB: write) | no |
| `history-list-mine` | history (DynamoDB: read) | no |
| `history-list-vehicle` | history (DynamoDB: read) | no |
| `history-trace` | history (DynamoDB: read) | no |
| `notifications-send` | notifications (DynamoDB: write) | no |
| `notifications-list-mine` | notifications (DynamoDB: read) | no |
| `datalake-ingest` | datalake (S3: write) | no |
| `datalake-promote-to-trusted` | datalake (S3: read and write) | no |
| `analytics-build-marts` | datalake (S3: read), analytics-marts (DynamoDB: read and write) | no |
| `analytics-rebuild-marts` | datalake (S3: read), analytics-marts (DynamoDB: read and write) | no |
| `analytics-detect-hotspots` | analytics-marts (DynamoDB: read) | yes |
| `analytics-get-mart` | analytics-marts (DynamoDB: read) | no |
| `analytics-dashboard` | analytics-marts (DynamoDB: read) | no |
| `analytics-health` | metrics (CloudWatch: read), dead-letter-queues (SQS: read) | no |
| `analytics-failed-events` | dead-letter-queues (SQS: read) | no |
| `analytics-replay-failed-events` | dead-letter-queues (SQS: read and write) | no |
<!-- functions:permissions:end -->

### Events

<!-- functions:events:start -->
| Event | Published by | Consumed by |
| --- | --- | --- |
| `DemandHotspotDetected` | `analytics-detect-hotspots` | `relocation-propose` |
| `IncidentReported` | `incidents-report` | `maintenance-detect`, `history-record`, `notifications-send`, `datalake-ingest` |
| `MaintenanceOrderCreated` | `maintenance-detect` | `history-record`, `notifications-send`, `datalake-ingest` |
| `MaintenanceTaskCompleted` | `maintenance-complete-task` | `availability-apply-event`, `incidents-on-task-completed`, `history-record`, `datalake-ingest` |
| `MaintenanceTaskStarted` | `maintenance-start-task` | `availability-apply-event`, `history-record`, `datalake-ingest` |
| `RelocationOrderCompleted` | `relocation-complete` | `history-record`, `notifications-send`, `datalake-ingest` |
| `RelocationOrderCreated` | `relocation-propose` | `history-record`, `notifications-send`, `datalake-ingest` |
| `RelocationOrderStatusChanged` | `relocation-assign`, `relocation-start` | `history-record`, `datalake-ingest` |
| `ReservationCancelled` | `reservations-cancel` | `availability-apply-event`, `history-record`, `datalake-ingest` |
| `ReservationConfirmed` | `reservations-confirm` | `history-record`, `datalake-ingest` |
| `ReservationExpired` | `reservations-expire` | `availability-apply-event`, `history-record`, `notifications-send`, `datalake-ingest` |
| `RideFinished` | `rides-finish` | `availability-apply-event`, `telemetry-on-ride-finished`, `history-record`, `notifications-send`, `datalake-ingest` |
| `RideStarted` | `rides-start` | `availability-apply-event`, `reservations-on-ride-started`, `history-record`, `datalake-ingest` |
| `UserRegistered` | `identity-register` | `profiles-on-user-registered`, `history-record`, `datalake-ingest` |
| `VehicleBatteryLow` | `telemetry-record`, `telemetry-on-ride-finished` | `availability-apply-event`, `maintenance-detect`, `history-record`, `notifications-send`, `datalake-ingest` |
| `VehicleInspectionDue` | `telemetry-on-ride-finished` | `maintenance-detect`, `datalake-ingest` |
| `VehiclePurchased` | `acquisitions-register` | `inventory-on-vehicle-purchased`, `availability-apply-event`, `history-record`, `datalake-ingest` |
| `VehicleReserved` | `reservations-create` | `availability-apply-event`, `history-record`, `notifications-send`, `datalake-ingest` |
| `VehicleRetired` | `inventory-retire` | `availability-apply-event`, `datalake-ingest` |
| `VehicleReturnedToService` | `maintenance-return-to-service` | `availability-apply-event`, `history-record`, `datalake-ingest` |
| `VehicleStateChanged` | `availability-apply-event` | `datalake-ingest` |
| `VehicleWithdrawnForMaintenance` | `maintenance-withdraw` | `availability-apply-event`, `history-record`, `datalake-ingest` |
<!-- functions:events:end -->
