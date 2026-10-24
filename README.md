# UrbanMove

Sistema distribuido de movilidad urbana **100 % serverless en AWS** (Computación en la Nube, ULPGC).

La arquitectura es de **microservicios serverless sin estado**: cada servicio son Lambdas con su propio
almacenamiento, ninguna guarda estado entre invocaciones (lo que hay que recordar vive en DynamoDB o S3) y los
servicios se hablan por API o por eventos. Las reglas completas están en `AGENTS.md`.

## Prerrequisitos

Todo el equipo debe tener las mismas versiones. Comprobar con los comandos de la última columna.

| Herramienta | Versión | Para qué | Instalar (Windows / macOS / Linux) | Comprobar |
|---|---|---|---|---|
| Git | >= 2.40 | control de versiones | `winget install Git.Git` / `brew install git` / `apt install git` | `git --version` |
| JDK | 21 (Temurin) | Lambdas en Java, Gatling | `winget install EclipseAdoptium.Temurin.21.JDK` / `brew install --cask temurin@21` / `apt install openjdk-21-jdk` | `java -version` |
| Maven | *no instalar* | usar el wrapper `./mvnw` (`mvnw.cmd` en Windows) que se commitea en cada módulo | n/a | `./mvnw -v` |
| Terraform | >= 1.9 | infraestructura como código | `winget install Hashicorp.Terraform` / `brew install terraform` / ver releases.hashicorp.com | `terraform -version` |
| AWS CLI | v2 | credenciales y pruebas manuales | `winget install Amazon.AWSCLI` / `brew install awscli` | `aws --version` |
| Node.js | >= 22.20 | frontend (Astro) y CLI de skills | `winget install OpenJS.NodeJS.LTS` / `brew install node` | `node -v` |
| Python | >= 3.10 | solo para la skill de diagramas | `winget install Python.Python.3.12` / `brew install python` | `python --version` |

Python: `python -m pip install -r requirements.txt` (en Windows `python` en lugar de `python3`).

## Credenciales

Nunca en el repo. Usar `aws configure sso` o variables de entorno / `~/.aws/credentials`
(en AWS Academy se copian de *AWS Details* y caducan con la sesión). `*.tfvars` y `*.tfstate` están en `.gitignore`.

## Agentes de IA (Claude Code y OpenCode)

- `AGENTS.md`: instrucciones del proyecto (OpenCode lo lee; `CLAUDE.md` lo importa para Claude Code).
- `.claude/skills/`: skills versionadas. Claude Code **y** OpenCode leen esta ruta de forma nativa,
  así que no hay symlinks ni copias (funciona igual en Windows).
- Cada skill de terceros incluye `LICENSE` y `PROVENANCE.md` (origen, commit y cambios locales).
  Revisar siempre el `SKILL.md` y los scripts antes de añadir una nueva.
