# infrastructure/README.md

Título: `# infrastructure — despliegue con Terraform`. Apertura: qué entorno es el objetivo (AWS Academy, AWS
real o LocalStack, según el ADR) y por qué.

Secciones:

1. **Módulos**: tabla `Módulo | Qué crea | Cuándo se despliega`. Separa lo que sobrevive a los redespliegues
   (tablas, Data Lake) de lo que cambia a diario (Lambdas), y di por qué.
2. **Antes de nada**: credenciales (`aws configure sso` o las de Academy, que caducan), estado remoto o local de
   Terraform, variables obligatorias. Nada de valores reales.
3. **Desplegar**: comandos reales en orden (`terraform init/plan/apply`, empaquetado previo, semillas) y qué
   saca cada uno (URLs, nombres) en los outputs.
4. **Cómo está montado**: árbol de la carpeta y la frase clave: «Terraform **no lista las Lambdas**: recorre
   `backend/functions.json`; añadir una función es añadir una entrada ahí» (skill `functions-registry`).
5. **Eventos y colas**: bus, colas, DLQ, reintentos y la política de retención.
6. **Observabilidad**: log groups con retención, panel, alarmas (con qué métrica y por qué) y dónde se ven.
7. **Escalado**: concurrencia reservada, paralelismo de las Lambdas de eventos, particionado del Data Lake.
8. **Simplificaciones conscientes**: lo que en producción se haría distinto (p. ej. `LabRole` compartido en
   Academy en vez de un rol por función, secretos, authorizer).
9. **Recoger la mesa**: `terraform destroy` y qué tarda o se queda atrás. Debe contener lo que exige la
   sección 17 del enunciado: **recursos creados, eliminados y activos, coste esperado y medidas para no exponer
   credenciales**. Mantenla al día en cada despliegue real.
10. **Pendiente**.

Fuente: ficheros `.tf`, `terraform output`, `backend/functions.json`, ADRs de `docs/adr/`.
