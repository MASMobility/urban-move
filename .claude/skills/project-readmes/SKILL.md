---
name: project-readmes
description: Escribe y actualiza los README de UrbanMove (raíz, backend/, db/, frontend/, infrastructure/) con el estilo del repo de referencia betta-tech/jornadas-cloud-2026: un README por carpeta que explica el porqué de cada decisión, con árbol de carpetas, tablas y secciones de decisiones y pendientes. Úsala al crear, rehacer o revisar cualquier README, o cuando un cambio de código deje un README desfasado. Use for writing or updating folder READMEs.
---

# README por carpeta, al estilo del repo de referencia

El modelo es [betta-tech/jornadas-cloud-2026](https://github.com/betta-tech/jornadas-cloud-2026): cada carpeta
tiene su README para poder enseñarla por separado, y el README explica **por qué** se hizo así, no solo cómo
se arranca. Aquí se adapta a UrbanMove (Java + Terraform + Astro, varios microservicios, eventos y Data Lake).

| README | Plantilla | Datos que salen de otro sitio |
|---|---|---|
| `README.md` (raíz) | `references/root.md` | carpetas reales y scripts reales |
| `backend/README.md` | `references/backend.md` | **tablas generadas desde `backend/functions.json`** |
| `db/README.md` | `references/db.md` | claves y accesos del código en `db/` |
| `frontend/README.md` | `references/frontend.md` | rutas HTTP de `backend/functions.json` |
| `infrastructure/README.md` | `references/infrastructure.md` | módulos y variables de Terraform |

Abre solo la plantilla del README en el que trabajas.

## Proceso

1. **Lee el código antes de escribir.** Cada afirmación (comando, ruta, nombre de tabla, número de
   funciones) sale de un fichero que has abierto. Lo que no existe todavía va a "Pendiente"; no se inventa.
2. **Backend: el registro manda.** Antes de tocar `backend/README.md` aplica la skill `functions-registry`
   y ejecuta `node .claude/skills/functions-registry/scripts/functions.mjs sync`. Las tablas entre
   `<!-- functions:...:start -->` y `<!-- functions:...:end -->` no se editan a mano; escribe alrededor.
3. **Escribe** siguiendo la plantilla y las reglas de estilo de abajo. Conserva el texto propio que ya hay:
   edita secciones, no reescribas el fichero entero si no hace falta.
4. **Verifica** antes de terminar:
   - Cada ruta en `` `backticks` `` que parezca un fichero o carpeta existe.
   - Cada comando que aparece existe (script de `package.json`, objetivo de Maven, comando de Terraform).
   - No hay cifras fijas que dependan del código ("once funciones"): enlaza la tabla generada o cuenta con
     `functions.json`.
   - `node .claude/skills/functions-registry/scripts/functions.mjs check` pasa.
5. **Un dato, un hogar.** Si ya está explicado en otro README, enlázalo (`../db/README.md`) en vez de copiarlo.

## Estilo (lo que hace reconocible a ese repo)

- **Español, en segunda persona** ("Fíjate en...", "pide acceso el primer día"). Directo, sin relleno.
- **Título con identidad**: `# backend — Lambdas de UrbanMove`, y un párrafo de apertura que dice qué hay y
  qué no (por ejemplo, "sin dependencias de runtime").
- **Árbol de carpetas** en bloque de código, con una frase por línea alineada en columna. Tras él, la regla
  de diseño que lo justifica ("los handlers no saben de base de datos").
- **Tablas** para todo lo enumerable: rutas, claves, métricas, módulos, patrones de acceso.
- **El porqué, con la alternativa descartada.** Un párrafo por decisión que empieza con una frase en
  negrita que enuncia la decisión: «**Los puntos los calcula el servidor.**» y después la razón y el coste.
- **Secciones honestas**: `## Decisiones que conviene no deshacer`, `## Simplificaciones conscientes`
  (lo que en producción se haría distinto), `## Lo que se dejó a medias a propósito` y `## Pendiente`.
  Una limitación conocida va en cita (`> Limitación conocida: ...`) y señala el fichero donde está anotada.
- **Avisos** con `>` para trampas que cuestan tiempo (tiempos de borrado, activar etiquetas de costes...).
- **Comandos reales** en bloques `bash`, en el orden en que se ejecutan, con una línea de comentario.
- **Cifras con unidades y origen**: coste por mes, latencia, límites. Si es estimación, dilo.
- **Referencias exactas**: `infrastructure/modules/api/main.tf`, no "el módulo de la API".

## Qué README sirve para qué entregable del PDF

| Entregable del enunciado | Dónde vive |
|---|---|
| Instrucciones de ejecución local (9) | `README.md` raíz, "Arrancar" |
| Documentación de APIs: endpoints, métodos, códigos (5) | `backend/README.md`, tabla de rutas generada (+ contratos en `docs/`) |
| Eventos: productor, consumidores, esquema (6) | `backend/README.md`, tabla de eventos generada (+ esquemas en `docs/`) |
| Ciclo de vida de los recursos y quién valida cada transición (sección 5) | `backend/README.md` |
| Propiedad de datos y data marts (7) | `db/README.md` |
| Despliegue y reproducción de la infraestructura (10) | `infrastructure/README.md` |
| Recursos creados, eliminados, activos, coste, credenciales (17) | `infrastructure/README.md`, "Recoger la mesa" |
| Observabilidad: logs, métricas, alarmas, panel (12) | `backend/README.md` (qué se emite) e `infrastructure/README.md` (dónde se ve) |
| CI/CD: pruebas, imágenes o artefactos, validaciones (11) | `README.md` raíz, sección "Pipeline" |
| Tolerancia a fallos y escalabilidad | decisiones en el README de la capa afectada, y un ADR (`write-adr`) |

El PDF se escribe a partir de estos README: si un dato falta aquí, falta en la entrega.

## Límites

- No escribas credenciales, IDs de cuenta, ARNs reales ni URLs privadas en ningún README (requisito 17).
- No documentes lo que no esté hecho como si lo estuviera: va a "Pendiente".
- Los diagramas están en `docs/*.drawio` (skill `aws-architecture-diagram`); el README los enlaza.
