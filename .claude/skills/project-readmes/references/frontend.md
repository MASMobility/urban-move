# frontend/README.md

Título: `# frontend — las aplicaciones cliente`. Apertura: Astro + Tailwind, y las tres interfaces diferenciadas
que pide el enunciado: **usuarios finales**, **mantenimiento y operaciones**, **dashboard operativo**. Di
cómo están separadas (apps distintas, o rutas y roles distintos) y por qué.

Secciones:

1. **Arrancar**: instalar, `dev`, `build`, `preview`, comprobación de tipos. Comandos reales de `package.json`.
   Qué pasa sin backend (mock) y con él (variable de entorno).
2. **Cómo está montado**: árbol de `src/` con una frase por carpeta y las reglas (qué es presentación, qué es
   acceso a datos).
3. **La frontera con el backend**: la interfaz del cliente de la API y sus implementaciones (mock y HTTP).
   Tabla `Variable | Implementación | Para qué`. Las decisiones que no deben deshacerse (el cliente no
   calcula nada de negocio; el token viaja en `Authorization`).
4. **Endpoints que usa cada app**: tabla `App | Método | Ruta | Para qué`. Se deriva de las rutas HTTP de
   `backend/functions.json` filtrando por `auth` (`user` → app de usuarios; `maintenance`/`admin` →
   mantenimiento y dashboard). Si cambian las rutas, cambia esta tabla.
5. **Rendimiento en móvil**: presupuesto de JavaScript, hidratación de islas (`client:visible`/`idle`),
   imágenes optimizadas, fuentes. Qué se mide (Lighthouse móvil) y la última cifra.
6. **Desplegar**: qué se publica (estático en S3 + CloudFront) y el enlace a `infrastructure/README.md`.
   Incluye la regla de reescritura de rutas del hosting si hay rutas dinámicas.
7. **Pendiente**.

Fuente: `package.json`, `astro.config.*`, `src/`, rutas de `backend/functions.json`.
