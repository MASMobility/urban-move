# UrbanMove: agent guide

Proyecto final de Computación en la Nube (ULPGC): sistema distribuido de movilidad urbana
(bicicletas y patinetes) **100 % serverless en AWS**. 

## Estructura compartida para agentes
- `AGENTS.md` es la fuente única de instrucciones (OpenCode lo lee nativamente; `CLAUDE.md` lo importa).
- `.claude/skills/` contiene las skills versionadas. Claude Code y OpenCode leen esta ruta de forma nativa
  (Claude Code NO lee `.agents/skills`; OpenCode lee ambas). Sin symlinks, por compatibilidad con Windows.
- Cada skill de terceros lleva su `LICENSE` y un `PROVENANCE.md` con origen y cambios locales.
- No instalar skills nuevas sin revisar su SKILL.md y scripts; después, versionarlas aquí.
- Prerrequisitos y versiones: ver `README.md` y `requirements.txt`. Usar Maven Wrapper (`./mvnw`), no `mvn` global.

## Arquitectura: microservicios serverless sin estado

Es el principio de diseño del proyecto; todo lo demás se deriva de él.

- **Microservicios serverless.** Cada microservicio es un conjunto de Lambdas (`backend/<servicio>/`) con una
  responsabilidad, su propio almacenamiento y despliegue independiente. Nada de servidores ni contenedores
  que haya que mantener encendidos.
- **Sin estado en el cómputo.** Una Lambda no guarda nada entre invocaciones: ni en memoria, ni en disco, ni
  en variables estáticas de la que dependa la lógica. Cada invocación puede ejecutarse en una instancia
  distinta (y en paralelo), así que lo que haya que recordar vive fuera: DynamoDB, S3 o Secrets Manager.
  Un caché en memoria solo vale como optimización que se pueda perder sin que nada se rompa.
- **Sesiones sin servidor.** La autenticación va en un token firmado que valida `identity-authorize`; no hay
  sesiones en memoria ni afinidad a una instancia.
- **Cada servicio es dueño de sus datos.** Nadie lee ni escribe tablas de otro servicio; se comunican por API
  o por eventos de dominio (colas SQS delante de cada consumidor).
- **Handlers idempotentes.** Los eventos se entregan al menos una vez y pueden repetirse: procesar el mismo
  `eventId` dos veces no debe duplicar nada. Las condiciones van en la escritura (DynamoDB), no en un `if`.
- **El Data Lake no es una base de datos transaccional.** Recoge eventos para análisis; las operaciones leen y
  escriben en las tablas del servicio.

Si un cambio necesita guardar estado en el cómputo, es una señal para replantearlo o, si de verdad hace
falta, para escribir un ADR (skill `write-adr`).

## Stack
- Infra como código: **Terraform** (`infrastructure/`). Lambdas en **Java** (`backend/`). Frontend en **Astro + Tailwind** (`frontend/`).
  Pruebas de carga: **Gatling** (Java; ubicación por decidir).
- Solo servicios serverless: Lambda, API Gateway, DynamoDB, SQS/SNS/EventBridge, S3, Step Functions, CloudWatch.
  Sin EC2/ECS/RDS salvo justificación explícita.
- Entorno objetivo: confirmar AWS Academy vs AWS real vs LocalStack (Academy restringe IAM: usar `LabRole`).

## Layout
Un monorepo con una carpeta por capa; cada una tiene su `README.md` (se explica por separado) y la raíz tiene el suyo.

| Carpeta | Contenido |
|---|---|
| `frontend/` | Las apps cliente en Astro + Tailwind: usuarios, mantenimiento/operaciones y dashboard. |
| `backend/` | Lambdas en Java: un módulo Maven por microservicio (`backend/<servicio>/`). `backend/functions.json` es el registro de todas las funciones. |
| `db/` | Modelo de datos (tablas DynamoDB por servicio, claves, patrones de acceso) y semillas. |
| `infrastructure/` | Terraform. Lee `backend/functions.json` para crear Lambdas, rutas e IAM; no las lista a mano. |
| `docs/` | Diagramas `.drawio`, ADRs (`docs/adr/`), contratos de API y de eventos. |

## Fuente única: `backend/functions.json`
Toda Lambda está en `backend/functions.json`; el empaquetado, Terraform y las tablas del README salen de ahí.
**Al añadir, renombrar, borrar o cambiar el disparador, los permisos o los eventos de una función, actualiza
`functions.json` en el mismo cambio** y ejecuta `node .claude/skills/functions-registry/scripts/functions.mjs sync`
(skill `functions-registry`). `... check` debe pasar antes de dar una tarea por terminada.

## Documentación
- READMEs por carpeta: skill `project-readmes`. Decisiones de arquitectura: skill `write-adr` (`docs/adr/`).
- Un dato vive en un solo README; los demás lo enlazan.

## Reglas
- Nunca commitear credenciales, tokens ni IDs de cuenta. `terraform.tfvars` y `*.tfstate` en `.gitignore`.
- Eventos de dominio con: id, timestamp, origen, tipo, versión de esquema, correlationId.
- Diagramas: usar la skill `aws-architecture-diagram`, salida en `docs/*.drawio`.
