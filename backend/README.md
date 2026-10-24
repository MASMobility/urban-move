# backend

## Funciones

Generado desde `functions.json` (`node .claude/skills/functions-registry/scripts/functions.mjs sync`). No lo edites a mano.

### Rutas HTTP

<!-- functions:routes:start -->
| Método | Ruta | Función | Servicio | Quién | Estado | Qué hace |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/auth/register` | `identity-register` | identity | público | planeada | Da de alta unas credenciales con rol user y emite UserRegistered; el perfil lo crea el servicio de perfiles. |
| POST | `/auth/login` | `identity-login` | identity | público | planeada | Comprueba las credenciales y devuelve un token de sesión firmado con el rol de la cuenta. |
| GET | `/auth/me` | `identity-me` | identity | user, maintenance, admin | planeada | Devuelve la identidad y el rol de la sesión actual. |
| POST | `/auth/staff` | `identity-create-staff` | identity | admin | planeada | Crea una cuenta de mantenimiento o de administración; solo la puede pedir un administrador. |
| GET | `/profiles/me` | `profiles-get-me` | profiles | user | planeada | Consulta el perfil y las preferencias del usuario autenticado. |
| PUT | `/profiles/me` | `profiles-update-me` | profiles | user | planeada | Actualiza los datos y preferencias del usuario, con validación básica. |
| DELETE | `/profiles/me` | `profiles-deactivate-me` | profiles | user | planeada | Baja lógica del usuario: conserva el histórico y deja de aceptar reservas. |
| GET | `/zones` | `zones-list` | zones | user, maintenance, admin | planeada | Lista las zonas de operación con sus restricciones de aparcamiento. |
| GET | `/zones/{zoneId}` | `zones-get` | zones | user, maintenance, admin | planeada | Devuelve una zona: límites simplificados, tipos de recurso admitidos y capacidad. |
| PUT | `/zones/{zoneId}` | `zones-put` | zones | admin | planeada | Crea o modifica una zona del catálogo. |
| GET | `/vehicles` | `inventory-list` | inventory | maintenance, admin | planeada | Lista los activos, filtrable por tipo, modelo y estado administrativo. |
| GET | `/vehicles/{vehicleId}` | `inventory-get` | inventory | maintenance, admin | planeada | Ficha de un activo: tipo, modelo, fecha de compra y estado administrativo. |
| POST | `/vehicles/{vehicleId}/retire` | `inventory-retire` | inventory | admin | planeada | Da de baja definitivamente un recurso (RETIRED). |
| POST | `/acquisitions` | `acquisitions-register` | acquisitions | maintenance, admin | planeada | Registra la compra o incorporación de recursos nuevos y emite un VehiclePurchased por cada uno. |
| GET | `/acquisitions` | `acquisitions-list` | acquisitions | maintenance, admin | planeada | Lista las adquisiciones registradas. |
| GET | `/availability` | `availability-list` | availability | user, maintenance, admin | planeada | Recursos reservables ahora, filtrables por zona y tipo (consulta del usuario). |
| GET | `/availability/{vehicleId}` | `availability-get` | availability | user, maintenance, admin | planeada | Estado operativo de un recurso; lo usan reservas y viajes antes de actuar. |
| GET | `/availability/summary` | `availability-summary` | availability | maintenance, admin | planeada | Recuento de recursos por estado, zona y tipo, en tiempo real. |
| POST | `/telemetry/readings` | `telemetry-record` | telemetry | admin | planeada | Recibe una lectura simulada (batería, ubicación, km) y emite VehicleBatteryLow si baja del umbral. |
| GET | `/telemetry/attention` | `telemetry-list-attention` | telemetry | maintenance, admin | planeada | Recursos con batería baja, uso anómalo o revisión pendiente (consulta de mantenimiento). |
| POST | `/reservations` | `reservations-create` | reservations | user | planeada | Reserva un recurso disponible con escritura condicional, para que no se reserve dos veces, y emite VehicleReserved. |
| POST | `/reservations/{reservationId}/confirm` | `reservations-confirm` | reservations | user | planeada | Confirma una reserva pendiente antes de que caduque. |
| POST | `/reservations/{reservationId}/cancel` | `reservations-cancel` | reservations | user | planeada | Cancela una reserva del usuario y libera el recurso. |
| GET | `/reservations/{reservationId}` | `reservations-get` | reservations | user | planeada | Consulta una reserva propia. |
| POST | `/rides` | `rides-start` | rides | user | planeada | Inicia un viaje sobre un recurso reservado o disponible y emite RideStarted. |
| POST | `/rides/{rideId}/finish` | `rides-finish` | rides | user | planeada | Finaliza el viaje en la zona de destino, calcula duración y coste preliminar y emite RideFinished. |
| GET | `/rides/{rideId}` | `rides-get` | rides | user, admin | planeada | Consulta un viaje: origen, destino, duración y coste. |
| POST | `/incidents` | `incidents-report` | incidents | user, maintenance | planeada | Registra una avería, vandalismo, bloqueo o recurso desaparecido, y emite IncidentReported. |
| GET | `/incidents` | `incidents-list` | incidents | maintenance, admin | planeada | Lista incidencias, filtrables por estado, tipo y recurso. |
| GET | `/maintenance-orders` | `maintenance-list-orders` | maintenance | maintenance, admin | planeada | Lista las órdenes de mantenimiento, filtrables por estado (abierta, en curso, completada). |
| GET | `/maintenance-orders/{orderId}` | `maintenance-get-order` | maintenance | maintenance, admin | planeada | Detalle de una orden con sus tareas. |
| POST | `/maintenance-orders/{orderId}/assign` | `maintenance-assign` | maintenance | maintenance, admin | planeada | Asigna una orden a una persona de mantenimiento. |
| POST | `/maintenance-orders/{orderId}/withdraw` | `maintenance-withdraw` | maintenance | maintenance, admin | planeada | Retira el recurso de la vía pública y emite VehicleWithdrawnForMaintenance. |
| POST | `/maintenance-orders/{orderId}/tasks` | `maintenance-start-task` | maintenance | maintenance, admin | planeada | Registra el inicio de una tarea de recarga, reparación o revisión. |
| POST | `/maintenance-orders/{orderId}/tasks/{taskId}/complete` | `maintenance-complete-task` | maintenance | maintenance, admin | planeada | Da por terminada una tarea y deja el recurso listo para volver a la calle. |
| POST | `/maintenance-orders/{orderId}/return-to-service` | `maintenance-return-to-service` | maintenance | maintenance, admin | planeada | Reincorpora el recurso al servicio, cierra la orden y emite VehicleReturnedToService. |
| GET | `/relocation-orders` | `relocation-list-orders` | relocation | maintenance, admin | planeada | Lista las órdenes de recolocación, filtrables por estado. |
| POST | `/relocation-orders/{orderId}/assign` | `relocation-assign` | relocation | maintenance, admin | planeada | Marca una orden como asignada. |
| POST | `/relocation-orders/{orderId}/start` | `relocation-start` | relocation | maintenance, admin | planeada | Marca una orden como en curso. |
| POST | `/relocation-orders/{orderId}/complete` | `relocation-complete` | relocation | maintenance, admin | planeada | Marca una orden como completada y emite RelocationOrderCompleted. |
| GET | `/history/me` | `history-list-mine` | history | user | planeada | Historial personal de reservas y viajes del usuario. |
| GET | `/history/vehicles/{vehicleId}` | `history-list-vehicle` | history | maintenance, admin | planeada | Historial de un recurso: viajes, incidencias, mantenimiento y recolocaciones. |
| GET | `/history/correlations/{correlationId}` | `history-trace` | history | maintenance, admin | planeada | Devuelve todos los eventos de un flujo por su correlationId, para diagnosticar de extremo a extremo. |
| GET | `/notifications` | `notifications-list-mine` | notifications | user, maintenance, admin | planeada | Bandeja de avisos de quien consulta. |
| POST | `/analytics/marts/rebuild` | `analytics-rebuild-marts` | analytics | admin | planeada | Recalcula los data marts de una ventana temporal indicada, por si un fallo los dejó incompletos. |
| GET | `/analytics/marts/{mart}` | `analytics-get-mart` | analytics | maintenance, admin | planeada | Consulta un data mart (users, reservations, rides, fleet, maintenance, operations, demand) con filtros de zona, tipo y ventana. |
| GET | `/analytics/dashboard` | `analytics-dashboard` | analytics | maintenance, admin | planeada | Resumen para el primer pintado del dashboard: flota por estado, reservas y viajes por franja, zonas con déficit o exceso, órdenes abiertas. |
| GET | `/analytics/health` | `analytics-health` | analytics | maintenance, admin | planeada | Salud del sistema: errores recientes por función y eventos fallidos pendientes. |
| GET | `/analytics/failed-events` | `analytics-failed-events` | analytics | admin | planeada | Lista los eventos que han acabado en una dead-letter queue, con su correlationId. |
| POST | `/analytics/failed-events/replay` | `analytics-replay-failed-events` | analytics | admin | planeada | Devuelve a su cola de origen los eventos de una dead-letter queue para reprocesarlos. |
<!-- functions:routes:end -->

### Funciones por eventos y por horario

<!-- functions:triggers:start -->
| Función | Servicio | Se dispara por | Consume | Publica | Estado | Qué hace |
| --- | --- | --- | --- | --- | --- | --- |
| `identity-authorize` | identity | Authorizer de API Gateway | — | — | planeada | Authorizer de API Gateway: valida el token una sola vez y pasa el rol a las funciones. |
| `profiles-on-user-registered` | profiles | SQS `profiles-events` | `UserRegistered` | — | planeada | Crea el perfil de un usuario recién registrado. Idempotente por userId. |
| `inventory-on-vehicle-purchased` | inventory | SQS `inventory-events` | `VehiclePurchased` | — | planeada | Da de alta como activo cada bicicleta o patinete comprado. Idempotente por vehicleId. |
| `availability-apply-event` | availability | SQS `availability-events` | `VehiclePurchased`, `VehicleReserved`, `ReservationCancelled`, `ReservationExpired`, `RideStarted`, `RideFinished`, `VehicleBatteryLow`, `VehicleWithdrawnForMaintenance`, `MaintenanceTaskStarted`, `MaintenanceTaskCompleted`, `VehicleReturnedToService`, `VehicleRetired` | `VehicleStateChanged` | planeada | Aplica a la máquina de estados del recurso cada evento que lo cambia, valida la transición y emite VehicleStateChanged. |
| `telemetry-on-ride-finished` | telemetry | SQS `telemetry-events` | `RideFinished` | `VehicleBatteryLow`, `VehicleInspectionDue` | planeada | Descuenta batería, suma el uso desde la última revisión y emite VehicleBatteryLow o VehicleInspectionDue si procede. |
| `reservations-expire` | reservations | Programada `rate(1 minute)` | — | `ReservationExpired` | planeada | Cada minuto libera las reservas sin confirmar a tiempo y emite ReservationExpired por cada una. |
| `reservations-on-ride-started` | reservations | SQS `reservations-events` | `RideStarted` | — | planeada | Marca la reserva como usada cuando empieza el viaje, para que no caduque en mitad de él. |
| `incidents-on-task-completed` | incidents | SQS `incidents-events` | `MaintenanceTaskCompleted` | — | planeada | Cierra la incidencia asociada cuando se completa la tarea de mantenimiento. |
| `maintenance-detect` | maintenance | SQS `maintenance-events` | `VehicleBatteryLow`, `IncidentReported`, `VehicleInspectionDue` | `MaintenanceOrderCreated` | planeada | Genera una orden de mantenimiento ante batería baja, avería o exceso de usos desde la última revisión. |
| `relocation-propose` | relocation | SQS `relocation-hotspots` | `DemandHotspotDetected` | `RelocationOrderCreated` | planeada | Crea una orden de recolocación desde una zona con exceso hacia la zona con déficit del hotspot y emite RelocationOrderCreated. |
| `history-record` | history | SQS `history-events` | `UserRegistered`, `VehiclePurchased`, `VehicleReserved`, `ReservationConfirmed`, `ReservationCancelled`, `ReservationExpired`, `RideStarted`, `RideFinished`, `VehicleBatteryLow`, `IncidentReported`, `MaintenanceOrderCreated`, `VehicleWithdrawnForMaintenance`, `MaintenanceTaskStarted`, `MaintenanceTaskCompleted`, `VehicleReturnedToService`, `RelocationOrderCreated`, `RelocationOrderStatusChanged`, `RelocationOrderCompleted` | — | planeada | Guarda cada evento relevante en el historial. Idempotente por eventId. |
| `notifications-send` | notifications | SQS `notifications-events` | `VehicleReserved`, `ReservationExpired`, `RideFinished`, `VehicleBatteryLow`, `IncidentReported`, `MaintenanceOrderCreated`, `RelocationOrderCreated`, `RelocationOrderCompleted` | — | planeada | Simula el envío de avisos a usuarios, mantenimiento u operaciones y los guarda en su bandeja. |
| `datalake-ingest` | datalake | SQS `datalake-ingest` | `IncidentReported`, `MaintenanceOrderCreated`, `MaintenanceTaskCompleted`, `MaintenanceTaskStarted`, `RelocationOrderCompleted`, `RelocationOrderCreated`, `RelocationOrderStatusChanged`, `ReservationCancelled`, `ReservationConfirmed`, `ReservationExpired`, `RideFinished`, `RideStarted`, `UserRegistered`, `VehicleBatteryLow`, `VehicleInspectionDue`, `VehiclePurchased`, `VehicleReserved`, `VehicleRetired`, `VehicleReturnedToService`, `VehicleStateChanged`, `VehicleWithdrawnForMaintenance` | — | planeada | Copia cada evento tal cual llega a raw/, particionado por fecha, tipo y servicio productor. |
| `datalake-promote-to-trusted` | datalake | S3 `datalake/raw/` | — | — | planeada | Valida y normaliza lo nuevo de raw/ y lo escribe en trusted/; lo que no cumple el esquema se aparta para revisarlo. |
| `analytics-build-marts` | analytics | S3 `datalake/trusted/` | — | — | planeada | Actualiza de forma incremental los data marts (usuarios, reservas, viajes, flota, mantenimiento, operaciones, demanda) con lo nuevo de trusted/. |
| `analytics-detect-hotspots` | analytics | Programada `rate(5 minutes)` | — | `DemandHotspotDetected` | planeada | Cada 5 minutos lee el data mart de demanda: zona con menos de 3 recursos y más de 10 intentos en la última hora es un hotspot; emite DemandHotspotDetected. |
<!-- functions:triggers:end -->

### Permisos por función

<!-- functions:permissions:start -->
| Función | Datos que toca | Publica eventos |
| --- | --- | --- |
| `identity-register` | identity-users (DynamoDB: escritura) | sí |
| `identity-login` | identity-users (DynamoDB: lectura), identity-signing-key (Secreto: lectura) | no |
| `identity-me` | identity-users (DynamoDB: lectura) | no |
| `identity-create-staff` | identity-users (DynamoDB: escritura) | no |
| `identity-authorize` | identity-signing-key (Secreto: lectura) | no |
| `profiles-on-user-registered` | profiles (DynamoDB: escritura) | no |
| `profiles-get-me` | profiles (DynamoDB: lectura) | no |
| `profiles-update-me` | profiles (DynamoDB: escritura) | no |
| `profiles-deactivate-me` | profiles (DynamoDB: escritura) | no |
| `zones-list` | zones (DynamoDB: lectura) | no |
| `zones-get` | zones (DynamoDB: lectura) | no |
| `zones-put` | zones (DynamoDB: escritura) | no |
| `inventory-on-vehicle-purchased` | inventory (DynamoDB: escritura) | no |
| `inventory-list` | inventory (DynamoDB: lectura) | no |
| `inventory-get` | inventory (DynamoDB: lectura) | no |
| `inventory-retire` | inventory (DynamoDB: escritura) | sí |
| `acquisitions-register` | acquisitions (DynamoDB: escritura) | sí |
| `acquisitions-list` | acquisitions (DynamoDB: lectura) | no |
| `availability-list` | availability (DynamoDB: lectura) | no |
| `availability-get` | availability (DynamoDB: lectura) | no |
| `availability-summary` | availability (DynamoDB: lectura) | no |
| `availability-apply-event` | availability (DynamoDB: lectura y escritura) | sí |
| `telemetry-record` | telemetry (DynamoDB: lectura y escritura) | sí |
| `telemetry-list-attention` | telemetry (DynamoDB: lectura) | no |
| `telemetry-on-ride-finished` | telemetry (DynamoDB: lectura y escritura) | sí |
| `reservations-create` | reservations (DynamoDB: lectura y escritura) | sí |
| `reservations-confirm` | reservations (DynamoDB: lectura y escritura) | sí |
| `reservations-cancel` | reservations (DynamoDB: lectura y escritura) | sí |
| `reservations-get` | reservations (DynamoDB: lectura) | no |
| `reservations-expire` | reservations (DynamoDB: lectura y escritura) | sí |
| `reservations-on-ride-started` | reservations (DynamoDB: lectura y escritura) | no |
| `rides-start` | rides (DynamoDB: lectura y escritura) | sí |
| `rides-finish` | rides (DynamoDB: lectura y escritura) | sí |
| `rides-get` | rides (DynamoDB: lectura) | no |
| `incidents-report` | incidents (DynamoDB: escritura) | sí |
| `incidents-list` | incidents (DynamoDB: lectura) | no |
| `incidents-on-task-completed` | incidents (DynamoDB: lectura y escritura) | no |
| `maintenance-detect` | maintenance-orders (DynamoDB: lectura y escritura) | sí |
| `maintenance-list-orders` | maintenance-orders (DynamoDB: lectura) | no |
| `maintenance-get-order` | maintenance-orders (DynamoDB: lectura) | no |
| `maintenance-assign` | maintenance-orders (DynamoDB: lectura y escritura) | no |
| `maintenance-withdraw` | maintenance-orders (DynamoDB: lectura y escritura) | sí |
| `maintenance-start-task` | maintenance-orders (DynamoDB: lectura y escritura) | sí |
| `maintenance-complete-task` | maintenance-orders (DynamoDB: lectura y escritura) | sí |
| `maintenance-return-to-service` | maintenance-orders (DynamoDB: lectura y escritura) | sí |
| `relocation-propose` | relocation-orders (DynamoDB: lectura y escritura) | sí |
| `relocation-list-orders` | relocation-orders (DynamoDB: lectura) | no |
| `relocation-assign` | relocation-orders (DynamoDB: lectura y escritura) | sí |
| `relocation-start` | relocation-orders (DynamoDB: lectura y escritura) | sí |
| `relocation-complete` | relocation-orders (DynamoDB: lectura y escritura) | sí |
| `history-record` | history (DynamoDB: escritura) | no |
| `history-list-mine` | history (DynamoDB: lectura) | no |
| `history-list-vehicle` | history (DynamoDB: lectura) | no |
| `history-trace` | history (DynamoDB: lectura) | no |
| `notifications-send` | notifications (DynamoDB: escritura) | no |
| `notifications-list-mine` | notifications (DynamoDB: lectura) | no |
| `datalake-ingest` | datalake (S3: escritura) | no |
| `datalake-promote-to-trusted` | datalake (S3: lectura y escritura) | no |
| `analytics-build-marts` | datalake (S3: lectura), analytics-marts (DynamoDB: lectura y escritura) | no |
| `analytics-rebuild-marts` | datalake (S3: lectura), analytics-marts (DynamoDB: lectura y escritura) | no |
| `analytics-detect-hotspots` | analytics-marts (DynamoDB: lectura) | sí |
| `analytics-get-mart` | analytics-marts (DynamoDB: lectura) | no |
| `analytics-dashboard` | analytics-marts (DynamoDB: lectura) | no |
| `analytics-health` | metrics (CloudWatch: lectura), dead-letter-queues (SQS: lectura) | no |
| `analytics-failed-events` | dead-letter-queues (SQS: lectura) | no |
| `analytics-replay-failed-events` | dead-letter-queues (SQS: lectura y escritura) | no |
<!-- functions:permissions:end -->

### Eventos

<!-- functions:events:start -->
| Evento | Lo publica | Lo consumen |
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
