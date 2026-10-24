> **EJEMPLO para calibrar el nivel de detalle. No es una decisión tomada por el equipo.**
> No lo copies a `docs/adr/` sin que el equipo haya decidido esto de verdad.

# ADR-0001: Usar una cola SQS por consumidor detrás de un bus de eventos

- **Estado:** Propuesta
- **Fecha:** 2026-10-24
- **Decide:** (nombres del equipo)
- **Relacionado:** `backend/README.md` (sección Eventos), `backend/functions.json` (disparadores `sqs`)

## Problema

Reservas, viajes y mantenimiento emiten eventos que consumen historial, notificaciones, disponibilidad y el
Data Lake. Si un consumidor cae, el productor no puede fallar ni perder el evento, y hay que poder
reprocesarlo. El entorno solo ofrece servicios serverless.

## Alternativas

### A. Productores invocan a los consumidores directamente (HTTP o Lambda)
- **A favor:** sencillo, sin infraestructura extra.
- **En contra:** acopla servicios; si historial cae, el viaje falla o se pierde el evento; sin reintentos.

### B. EventBridge hacia una cola SQS por consumidor, cada una con su DLQ
- **A favor:** desacopla; cada consumidor escala y falla por separado; reintentos y DLQ nativos.
- **En contra:** más recursos que declarar; entrega al menos una vez, así que los consumidores deben ser idempotentes.

### C. Kafka (MSK)
- **A favor:** orden y reproducción potentes.
- **En contra:** no es serverless de verdad, coste fijo alto, excesivo para el volumen.

## Decisión

Usamos B: un bus de EventBridge y una cola SQS con DLQ por consumidor. Es lo que mejor cubre desacoplo,
reintentos y reproceso sin salir de lo serverless.

## Consecuencias

- **Buenas:** un fallo de historial no afecta a reservar ni a viajar; los eventos fallidos quedan en la DLQ y se
  pueden reenviar.
- **Malas:** al menos una entrega ⇒ hay que escribir cada consumidor de forma idempotente (por `eventId`).
- **Riesgos y cómo se vigilan:** DLQ llenándose sin que nadie lo vea; se enseña su profundidad en
  `GET /analytics/health`.

## Dónde se ve en el código

- `backend/functions.json`: las funciones con `trigger.type = "sqs"` y su `consumes`.
- `infrastructure/`: la regla del bus y una cola con DLQ por cada `queue` del registro.
