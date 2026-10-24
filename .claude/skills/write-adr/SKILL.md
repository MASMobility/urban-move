---
name: write-adr
description: Escribe y mantiene los ADR (decisiones de arquitectura) de UrbanMove en docs/adr/, con problema, alternativas, decisión y consecuencias, como pide el enunciado (mínimo dos). Úsala cuando se tome o se cambie una decisión de arquitectura (bus de eventos, base de datos, arranque en frío de Java, entorno AWS Academy o LocalStack, estrategia anti doble reserva...), cuando el usuario pida "un ADR", o al documentar por qué algo está hecho así. Use for architecture decision records.
---

# ADR de UrbanMove

Un ADR es un documento **breve** que deja por escrito una decisión de arquitectura: qué problema había, qué
opciones se miraron, cuál se eligió y qué cuesta. El enunciado exige al menos dos y los pide con esa
estructura (*problema, alternativas, decisión y consecuencias*). En la defensa se pregunta "por qué" de cada
pieza: el ADR es la respuesta preparada, enlazada al código real.

## Cuándo escribir uno

Escribe un ADR si la decisión:
- afecta a la estructura, a interfaces entre servicios o a un atributo de calidad (fallos, coste, escala), y
- es cara de revertir, o alguien que llegue después se preguntará "¿por qué así?", y
- tuvo alternativas reales con ventajas e inconvenientes.

No lo escribas para estilo de código (lo cubre el linter), un detalle local de un solo handler o un apaño
temporal. Si dudas: ¿lo defenderías en la defensa con una frase? Entonces probablemente merece un ADR.

## Dónde y cómo se llama

- Carpeta `docs/adr/`. Fichero `NNNN-verbo-en-infinitivo.md`, minúsculas con guiones, sin tildes:
  `0001-usar-sqs-y-eventbridge-como-bus.md`. `NNNN` es el siguiente número libre (mira `docs/adr/`).
- Índice `docs/adr/README.md`: tabla `Nº | Decisión | Estado | Fecha`. Créalo con el primer ADR y
  actualízalo en el mismo cambio que cualquier ADR nuevo o que cambie de estado.
- Un ADR, una decisión. Si salen dos, son dos ficheros que se enlazan.

## Proceso

1. **Entiende la decisión.** Si no está clara por el código, el chat o `git log`, **pregunta** al usuario qué se
   decidió y por qué. No inventes una decisión ni un motivo: si es solo una propuesta, el estado es `Propuesta`.
2. **Reúne evidencia real.** Abre los ficheros afectados (`infrastructure/`, `backend/functions.json`, `db/`).
   Cada afirmación sobre el sistema debe poder comprobarse ahí; las cifras (coste, latencia, límites de AWS
   Academy) llevan unidad y origen, o se marcan como estimación.
3. **Copia `plantilla.md`** a `docs/adr/NNNN-...md` y rellénala. Mira `ejemplo.md` para el nivel de detalle.
4. **Alternativas honestas.** Al menos dos, la elegida incluida, con a favor y en contra de verdad. Una
   alternativa de paja no cuenta. Incluye "no hacer nada" si procede.
5. **Consecuencias con inconvenientes.** Lo malo se escribe: coste, deuda, riesgos y cómo se vigilan.
6. **Enlaza con el código.** La sección "Dónde se ve en el código" nombra ficheros reales (módulo Terraform,
   función de `functions.json`, tabla de `db/`). La defensa pide relacionar decisión y repositorio.
7. **Actualiza el índice** y, si el ADR cambia lo que dice algún README, ese README (skill `project-readmes`).

## Reglas

- **Una vez `Aceptada`, no se reescribe.** Si la decisión cambia, crea un ADR nuevo, pon en el viejo
  `Sustituida por ADR-NNNN` y enlaza ambos.
- Presente y voz directa ("Usamos SQS delante de cada consumidor"), en español, una página como mucho.
- Fecha: la de hoy en formato `AAAA-MM-DD`. Autoría: quienes decidieron, por nombre.
- Sin credenciales, IDs de cuenta ni ARNs reales.

## Candidatas para este proyecto

Decisiones que el enunciado obliga a tomar, y que se defenderán. **Son temas, no decisiones tomadas:** pregunta
al equipo antes de redactar.

| Tema | Alternativas típicas | Qué toca |
|---|---|---|
| Bus y colas de eventos | EventBridge + SQS por consumidor, SNS + SQS, Kafka | `functions.json` (`consumes`), `infrastructure/` |
| Dónde corre y se despliega todo | AWS Academy, AWS real, LocalStack | todo; condiciona IAM (`LabRole`) |
| Una Lambda por ruta o por servicio | una por handler, una por microservicio | `functions.json`, empaquetado |
| Arranque en frío de Java | SnapStart, Micronaut/GraalVM, memoria mayor | `backend/`, `memoryMb` |
| Evitar doble reserva | escritura condicional, bloqueo, cola FIFO | `reservations-create`, `db/` |
| Datos: tabla por servicio frente a tabla única | DynamoDB por servicio, tabla compartida | `db/`, propiedad de datos |
| Data marts: dónde se sirven | DynamoDB, S3 + Athena | `analytics-*`, `db/` |
| Reprocesar eventos fallidos | DLQ + redrive manual, reintentos automáticos | `analytics-replay-failed-events` |
| Autenticación | Lambda authorizer propio, Cognito | `identity-authorize` |
