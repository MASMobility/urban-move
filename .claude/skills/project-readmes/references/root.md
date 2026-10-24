# README.md (raíz)

Es la puerta de entrada: qué es el proyecto, cómo se arranca y dónde está cada cosa. No explica decisiones
de capa (eso es de cada carpeta).

Secciones, en este orden (omite las que aún no apliquen):

1. **Título y párrafo de apertura.** Qué es UrbanMove, que es el proyecto final de Computación en la Nube
   y que es 100 % serverless en AWS.
2. **Mapa de carpetas** en bloque de código, una línea por carpeta (`frontend/`, `backend/`, `db/`,
   `infrastructure/`, `docs/`), y una frase: cada carpeta tiene su README para enseñarla por separado.
3. **Prerrequisitos** (ya existe la tabla de versiones; mantenla al día) y **Credenciales** (nunca en el repo).
4. **Arrancar en local**: el flujo mínimo y razonable de comandos (el enunciado pide uno solo). Incluye la
   tabla de comandos reales: instalar, arrancar, probar, empaquetar, desplegar, destruir.
5. **Las fronteras del proyecto**: las interfaces que permiten cambiar lo que hay detrás (por ejemplo, el
   cliente HTTP del frontend frente a un mock, o el repositorio de datos frente a una implementación en
   memoria). Tabla `Interfaz | Separa | Hoy | Después`.
6. **Flujos de demostración**: los cinco del enunciado (usuario, mantenimiento, analítica y recolocación,
   dashboard, fallo controlado), cada uno con los comandos o pasos para reproducirlo.
7. **Pipeline**: qué ejecuta CI en cada cambio (pruebas, formato, imágenes o artefactos, `functions.mjs check`).
8. **Agentes de IA**: `AGENTS.md`, `.claude/skills/` (ya está).
9. **Antes de enseñarlo / Pendiente**: tabla `Qué | Estado` con prioridad (🔴🟠🟡).
10. **Reparto del trabajo**: quién hizo qué (lo pide el PDF; aquí o enlazado desde el PDF).

Fuente de cada dato: `package.json`/`pom.xml`/Terraform para comandos y versiones; `git log` para el reparto.
