# Funcionalidades y alcance

Desglose feature por feature de lo que entra en el prototipo. Prioridad `P0` = sin esto no hay demo, `P1` = suma mucho si hay tiempo, `P2` = mencionar en el pitch como roadmap, no construir.

## P0 — Núcleo (sin esto no hay demo)

### 1. Identificación simulada del cliente — implementado, ampliado más allá del plan original
- **Qué hace:** al entrar a cualquiera de las 2 superficies, se establece qué cuenta financiera está "hablando" con el bot.
- **Landing (`app/page.tsx`):** pantalla de entrada con un campo para ingresar el ID de cualquier cuenta real del dataset — al elegir destino, ese ID viaja por query string (`?customer_key=...`) y llega ya cargado a `/dashboard` o `/whatsapp`.
- **App Mi Movistar (skin):** además de la landing, mantiene su propio selector de las 6 cuentas curadas de demo (`GET /api/customers`) y un input libre por si se quiere cambiar de cuenta sin volver a la landing — no depende de la lista curada, acepta cualquier `FINANCIAL_ACCOUNT_KEY` real de `FACTURACION-CLIENTES.csv`.
- **WhatsApp (skin):** si el ID llega desde la landing, salta directo al chat (ya se "identificó" ahí); si se entra directo a `/whatsapp`, mantiene el paso de verificación simulada (teléfono/OTP falso) sobre las cuentas curadas, como narrativa de Zero Trust.
- **Criterio de aceptación:** una vez identificado, todo el resto de la conversación queda atado a esa cuenta financiera y no se cruza con datos de otra.
- **Dataset:** `PLANTA CLIENTES.csv` (cuentas curadas de demo) + `FACTURACION-CLIENTES.csv` (cualquier cuenta real, vía `FINANCIAL_ACCOUNT_KEY`).

### 2. Motor de diff determinista (Diff Engine)
- **Qué hace:** dado un `FINANCIAL_ACCOUNT_KEY`, trae el recibo actual + 5 anteriores desde `FACTURACION-CLIENTES.csv`, los compara y detecta qué `CHARGE_CODE` cambió, apareció o desapareció, y por cuánto.
- **Criterio de aceptación:** el resultado es 100% trazable a filas reales del CSV — cero cálculos "adivinados" por el LLM.
- **Dataset:** `FACTURACION-CLIENTES.csv` + tablas de escenario (`BRAINY_PRORRATEO_ALTASV3.csv`, `BRAINY_RECONEXIONESV3.csv`).

### 3. Explicación de 2 escenarios garantizados

- **Cobro por reconexión tras suspensión** — cuenta detectada vía `BRAINY_RECONEXIONESV3.csv`. **Hay más de un `CHARGE_CODE` de reconexión** (`OC1_RECONEXION`, `FRIORX_001` "Reconexión Mono Internet", etc.) — el motor no busca por código fijo, cruza por cuenta + número de recibo contra la tabla de reconexiones. Esta explicación **sí es comparativa**: recibo actual vs anterior.

- **Prorrateo — ojo, cambia el tipo de explicación.** `BRAINY_PRORRATEO_ALTASV3.csv` son prorrateos por **ALTAS** (activación de un cliente nuevo), confirmado al probar contra datos reales: de las cuentas con prorrateo en su recibo más reciente, **ninguna tiene un recibo anterior** — es literalmente su primer recibo. Por diseño no hay "mes anterior" con qué comparar. La explicación de este escenario no es "por qué cambió tu recibo", es **"por qué tu primer recibo es por este monto"** (activaste el servicio a mitad de ciclo, se cobra proporcional a los días). El motor ya soporta esto: `compareInvoices()` devuelve `hasComparison: false` en este caso, y el frontend/prompt debe ajustar el mensaje en consecuencia (no decir "subió/bajó", decir "así se calculó").

- **Criterio de aceptación:** para al menos 2 cuentas reales (una de cada escenario, ver lista abajo), el bot explica correctamente la causa, el monto y la fecha — con o sin comparación según corresponda.

**Cuentas de demo verificadas** (recibo actual real, calculado con datos de hoy — pueden dejar de ser "las más recientes" a medida que pase el tiempo, si eso pasa correr `scripts/find-demo-accounts.ts` de nuevo):

| Escenario | Cuenta (`FINANCIAL_ACCOUNT_KEY`) | Nota |
|---|---|---|
| Reconexión | `104180441` | delta +4.58, la más limpia — el único cambio es la reconexión |
| Reconexión | `316624004` | delta +4.57, igual de limpia |
| Reconexión | `317205366` | delta +4.57, igual de limpia |
| Prorrateo (primer recibo) | `761895720` | recibo S/.79.79, prorrateo de S/.39.90 |
| Prorrateo (primer recibo) | `761979256` | recibo S/.55.81, prorrateo de S/.25.91 |

### 4. Traducción a lenguaje humano (capa determinista + Gemini)
- **Qué hace:** una vez identificado el `CHARGE_CODE`, se mapea directo a la sección correspondiente del MD de conceptos (curado del material de Academia Movistar) y Gemini redacta la explicación final combinando: números exactos (paso 2) + concepto general (este paso).
- **Criterio de aceptación:** el LLM nunca recibe ni puede modificar los montos — solo redacta a partir de lo que ya se calculó.
- **Dataset:** MD curado a mano (`concepts/*.md`, por definir con el equipo) desde los PDF/PPTX de "Experto en facturación".

### 5. Retrieval vectorial liviano (preguntas abiertas / FAQ) — implementado
- **Qué hace:** en cada pregunta del flujo normal (no solo cuando no hay causa detectada), se embebe la pregunta (`gemini-embedding-001`) y se busca por similitud coseno contra `data/embeddings.json` (12 conceptos de `concepts/*.md`, generado por `scripts/build-embeddings.ts`). Cubre preguntas generales tipo "¿qué es Movistar Total?", "¿puedo fraccionar mi deuda?", incluso en una cuenta que además tiene una causa de variación detectada.
- **Criterio de aceptación:** nunca decide montos, solo qué fragmento de explicación mostrar; si no hay match por encima del umbral de similitud, no se inyecta nada (probado con una pregunta sin relación — el bot no inventa una respuesta).
- **Dataset:** los 12 `concepts/*.md` — 3 por mapeo directo (causa del diff engine), 9 por esta búsqueda semántica.

### 6. Next Best Action
- **Qué hace:** tras la explicación, ofrece: pagar, ver el detalle, o (si aplica) derivar a un asesor.
- **Criterio de aceptación:** las opciones mostradas dependen del resultado del diff engine, no son fijas.

### 7. Hand-off con contexto (vista completa)
- **Qué hace:** si el bot no puede resolver la consulta, muestra una pantalla/tarjeta con el resumen que "se envía al asesor": motivo, montos involucrados, y lo que ya se le explicó al cliente.
- **Criterio de aceptación:** el payload mostrado contiene datos reales de la conversación, no un texto fijo genérico.

## P1 — Si sobra tiempo

### 8. Tercer escenario: fin de descuento promocional — implementado
- **Estado:** implementado y probado (adelantado desde Bloque F). Sigue siendo el 3ro en confiabilidad frente a prorrateo/reconexión — úsenlo como bonus en el pitch, no como principal.
- **Hallazgo técnico:** `BRAINY_DESCUENTOS_CUOTAS.csv` **no tiene** columna `NumeroRecibo` como los otros dos archivos, y cruzarlo por cuenta + ventana de fechas (`FechaFin` entre el recibo anterior y el actual) da muchos falsos positivos — el 75% de esos casos no mostraban ningún cambio real de monto (probablemente porque otro descuento/bono los reemplazó en simultáneo). Por eso la detección **no usa ese archivo como fuente de verdad**: se detecta directamente desde el diff real de `FACTURACION-CLIENTES.csv` — un cargo con `CHARGE_CODE_CLASSIFICATION` de `Descuento Cargo Recurrente` o `DESCUENTO Fija` que desaparece del recibo actual. Esto es más confiable y ya viene con una descripción legible (`CHARGE_CODE_DESC`, ej. "Descuento 20% por 3 meses").
- **Cuentas de demo verificadas** (causa única, delta = exactamente el monto del descuento):

| Cuenta | Delta | Descuento que terminó |
|---|---|---|
| `720710029` | +S/.5.98 | Descuento 20% por 3 meses |
| `347778600` | +S/.34.45 | Dscto por campaña VEN A MOVISTAR 1 |
| `723487275` | +S/.12.95 | Descuento Fidelización por 3 meses |
| `759695714` | +S/.39.96 | Descuento 50%x6 meses |

### 9. Cross-selling restrictivo — 2 reglas — implementado
- **Regla 1 (fin de descuento):** si la causa detectada es `fin_descuento` y la consulta se resolvió → se ofrece un nuevo descuento de fidelización real del catálogo (`FRIRDE_103`, "DSCT FIDELIZACION S/ 10").
- **Regla 2 (reconexión):** si hubo reconexión, la consulta se resolvió, y el cliente no tiene ya un bono de datos activo (`Bono Recurrente Cargo`/`BONIFICACION / GRATUIDAD Fija` en su recibo actual) → se ofrece un bono económico real del catálogo (`RCD_PAQRE189`, "Bono 10GB x1meses").
- Si un mismo recibo tiene ambas causas, se prioriza la Regla 2 (el escenario garantizado).
- **Criterio de aceptación:** el bot nunca ofrece nada si la consulta no se resolvió, sin excepción — probado en ambas ramas.

### 10. "Efecto Efervescente" — implementado
- **Qué hace:** al cerrar una interacción resuelta positivamente, recuerda un beneficio real que el cliente ya tiene en su recibo actual (`CHARGE_CODE_CLASSIFICATION` de tipo bono/bonificación). Si no tiene ninguno, no se fuerza nada — se omite en vez de inventar un beneficio que no existe en su data.
- **Dataset:** el propio recibo actual del cliente en `FACTURACION-CLIENTES.csv` (no el catálogo completo — tiene que ser algo que el cliente realmente tenga).

### 11. Clasificador de sentimiento — implementado, más completo que lo planeado originalmente
- **Qué hace:** clasificador independiente (`lib/sentiment.ts`, `gemini-flash-lite-latest`) que analiza únicamente el texto del mensaje — nunca ve datos financieros ni comparte sesión con el motor de explicación — y devuelve una temperatura (positiva/neutral/negativa/crítica) + confianza + señales detectadas. Conectado al Gate de decisión en `app/api/chat/route.ts`, por encima de la clasificación de intención por palabras clave:
  - **Crítica** → hand-off inmediato, sin oferta comercial, sin importar el turno de la conversación.
  - **Negativa con confianza ≥ 0.75** → si ya se explicó algo y el cliente sigue así, dispara hand-off y bloquea cross-selling.
  - **Neutral/positiva** → flujo estándar (la positiva habilita con normalidad el "Efecto Efervescente"/cross-selling si la regla de negocio ya lo permitía).
- **Criterio de aceptación:** probado en vivo con los 4 casos — un mensaje crítico deriva de inmediato, un mensaje negativo persistente dispara hand-off aunque no use ninguna palabra clave de "asesor"/"no entiendo", y el `tone` de la respuesta siempre refleja la clasificación real.
- **Dataset/fuente:** `Database/prompt_analisis_sentimiento_claria.md`.

## P2 — Roadmap para el pitch (no se construye)

- Integración real con WhatsApp Business API.
- Conexión real a BrainyBill / CRM Amdocs en vez de CSV locales.
- Automatización con IA de la extracción PDF/PPTX → MD.
- Ver recibos de múltiples líneas bajo la misma cuenta financiera.
- Modelo de predicción (regresión/ML) de próximo recibo — descartado, ver [INVESTIGACION-DESAFIO1.md](./INVESTIGACION-DESAFIO1.md).
