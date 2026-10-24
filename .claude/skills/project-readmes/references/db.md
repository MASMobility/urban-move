# db/README.md

Título: `# db — el modelo de datos`. Apertura: qué almacenes hay (DynamoDB por servicio, S3 para el Data Lake)
y dónde está la implementación ejecutable (claves, esquemas). Un mini árbol de `db/`.

Secciones:

1. **El punto de partida**: en DynamoDB el modelo sale de las **consultas**, no de las entidades. Lista los
   patrones de acceso (los métodos de los repositorios) antes de describir tablas.
2. **Propiedad de datos**: tabla `Entidad | Tabla | Servicio dueño | Quién más la lee (por evento o API)`.
   Es la "tabla de propiedad de datos" que exige el enunciado; ningún servicio escribe en una tabla ajena.
3. **Tablas**: por tabla, `PK | SK | Entidad`, índices (GSI) y TTL.
4. **Cada patrón, su operación**: tabla `# | Método | Operación (GetItem/Query/TransactWrite...) | Nota`.
   Señala dónde se usan condiciones para garantizar unicidad o idempotencia (p. ej. reservas).
5. **Las N decisiones que importan**: cada una con título numerado, el problema y por qué esta solución y no la
   alternativa (por qué un GSI, por qué un ítem puntero, por qué condiciones en vez de `if`).
6. **Data Lake**: capas `raw/`, `trusted/`, `curated/`, esquema de particiones (`year=/month=/day=/source=`) y
   cómo llega un evento hasta ahí.
7. **Data marts**: tabla `Data mart | Dominio | Pregunta que responde | Se construye con`, y una consulta o
   indicador de ejemplo de cada uno. Marca cuál alimenta la decisión de recolocación.
8. **Lo que se dejó a medias a propósito**: límites conocidos (Scans evitados, agregaciones en memoria...).
9. **Carga inicial**: cómo se siembran datos y cómo se reinician (comandos reales).

Fuente: código de `db/`, repositorios en `backend/`, `functions.json` (`uses`) para saber quién toca qué tabla.
