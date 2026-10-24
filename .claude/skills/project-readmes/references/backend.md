# backend/README.md

Título: `# backend — Lambdas de UrbanMove`. Apertura: cuántos microservicios (módulos `backend/<servicio>/`),
lenguaje y runtime (Java 21), y qué no hay (frameworks pesados, estado en memoria...). No pongas el número de
funciones: lo dice la tabla generada.

Secciones:

1. **Arrancar en local**: compilar con Maven Wrapper (`./mvnw`), ejecutar las pruebas, y cómo se prueba una
   Lambda sin desplegar (lo que se decida: SAM local, LocalStack, pruebas de handler). Variables de entorno.
2. **Funciones** — *bloque generado*. `sync` crea esta sección con cuatro tablas (rutas HTTP, funciones por
   eventos, permisos, eventos). No las edites. Debajo, una frase: «La lista viva está en `functions.json`,
   que consumen el empaquetado y Terraform».
3. **Estructura**: árbol de un módulo de servicio típico (`handler/`, `domain/`, `repository/`, `events/`) con
   la regla de capas («los handlers no saben de base de datos y el dominio no sabe de HTTP»).
4. **Ciclo de vida de un recurso**: tabla de estados (`AVAILABLE`, `RESERVED`, `IN_USE`, `LOW_BATTERY`,
   `WITHDRAWN`, `CHARGING`, `REPAIRING`, `READY_FOR_SERVICE`, `RETIRED`) con `Desde | Evento | Hasta | Servicio
   que valida la transición`. Lo pide la sección 5 del enunciado.
5. **Decisiones que conviene no deshacer**: p. ej. cómo se evita reservar dos veces el mismo recurso (escritura
   condicional), idempotencia al reprocesar eventos, correlationId en cada evento. Cada una con su porqué.
6. **Eventos**: formato común (id, timestamp, origen, tipo, versión de esquema, correlationId) y dónde están
   los esquemas. La tabla de productores y consumidores es la generada.
7. **Observabilidad**: logs estructurados con correlationId, qué métricas se emiten (tabla `Métrica | Unidad |
   Dimensión | Dónde`), y la regla de cardinalidad de dimensiones.
8. **Tolerancia a fallos**: reintentos, DLQ, degradación funcional; enlaza el ADR o el escenario probado.
9. **Empaquetado**: dónde queda cada jar y qué handler lleva.
10. **Pendiente**.

Fuente: `backend/functions.json`, `pom.xml`, código de los handlers, ADRs de `docs/adr/`.
