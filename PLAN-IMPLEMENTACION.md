# Plan / Spec de implementación

Cómo se construye lo definido en [PRD.md](./PRD.md) y [FUNCIONALIDADES.md](./FUNCIONALIDADES.md), sobre el flujo descrito en [FLUJO-INFORMACION.md](./FLUJO-INFORMACION.md), en 2 días con 4 personas.

## Stack

- **Next.js 16 / React 19** (proyecto `botulima` ya existente) — una sola app, frontend + API routes haciendo de "backend".
- **Gemini API** — generación de texto (explicación final) + embeddings (capa vectorial de conceptos/FAQ).
- **Sin base de datos externa.** Los CSV se leen del filesystem (son de solo lectura en runtime); el JSON de embeddings se precalcula una vez y se empaqueta con el deploy.
- **Deploy:** Vercel (opcional pero recomendado, un comando, da URL pública para el jurado).

## Estructura de carpetas propuesta

```
botulima/
  Database/                       # datasets ya entregados (no tocar)
  concepts/                       # MD curados — 10 archivos, ver tabla de estado en Bloque B
  data/
    embeddings.json               # NUEVO — generado por el script de ingesta, se commitea
  scripts/
    build-embeddings.ts           # NUEVO — lee concepts/*.md, llama a Gemini embeddings, escribe data/embeddings.json
  lib/
    diff-engine.ts                # NUEVO — lee CSVs, compara recibo actual vs 5 anteriores
    csv-loader.ts                 # NUEVO — parseo de los CSV (UTF-8 estándar)
    concept-retrieval.ts          # NUEVO — mapeo directo CHARGE_CODE -> concepto + fallback vectorial
    gemini.ts                     # NUEVO — wrapper de las llamadas a Gemini (generation + embeddings)
    cross-selling.ts              # NUEVO — Regla 1 y Regla 2
  app/
    api/
      chat/route.ts                # NUEVO — endpoint principal: recibe pregunta + cuenta, devuelve respuesta
      customers/route.ts           # NUEVO — lista de clientes para el selector de la demo
    (mi-movistar)/
      page.tsx                     # NUEVO — vista tipo App Mi Movistar (recibo + botón)
    (whatsapp)/
      page.tsx                     # NUEVO — skin tipo WhatsApp
    components/
      Chat.tsx                     # NUEVO — motor de chat compartido por las 2 skins
      ReceiptCard.tsx               # NUEVO — tarjeta de recibo/desglose
      HandoffSummary.tsx            # NUEVO — vista de resumen para el asesor
```

## Fases

### Día 1 — Motor y datos (foco: que el diff engine y la explicación funcionen por API, sin UI todavía)

**Bloque A — Ingesta y diff engine (líder técnico)**
1. Parsear `FACTURACION-CLIENTES.csv`, `BRAINY_PRORRATEO_ALTASV3.csv`, `BRAINY_RECONEXIONESV3.csv` (`lib/csv-loader.ts`).
2. Implementar el diff engine: dado un `FINANCIAL_ACCOUNT_KEY`, devolver el recibo actual + 5 anteriores y qué cambió (`lib/diff-engine.ts`).
3. Probar contra 2-3 cuentas reales de cada escenario garantizado (usar las que ya sabemos que están limpias, ver la tabla de cuentas verificadas en [FUNCIONALIDADES.md](./FUNCIONALIDADES.md)).

**Ya implementado y probado** (Bloques A y C completos): `lib/csv-loader.ts`, `lib/diff-engine.ts`, `lib/gemini.ts`, `lib/concept-retrieval.ts` (stub, pendiente de Bloque B) y `app/api/chat/route.ts` funcionan de punta a punta contra datos reales. Los CSV son UTF-8 normal — nada de encoding especial que manejar.

**Bloque B — Curación de conceptos (delegable)**
1. Un teammate extrae a mano de los PDF/PPTX de Academia Movistar el contenido de "prorrateo" y "reconexión" a `concepts/*.md`.
2. Escribir `scripts/build-embeddings.ts`: lee los MD, llama al endpoint de embeddings de Gemini, guarda `data/embeddings.json`.
3. Correrlo una vez, verificar que el JSON se generó bien.

**Completo.** Con los archivos de KB que pasó el equipo, `concepts/` tiene 12 archivos, y los 12 ya alimentan al bot — 3 por mapeo directo (causa del diff engine → texto curado, sin llamada extra a Gemini) y 9 por búsqueda vectorial (`scripts/build-embeddings.ts` + `data/embeddings.json`, ver detalle más abajo):

| Archivo | Cómo llega al bot |
| --- | --- |
| `prorrateo.md` | Mapeo directo — causa `prorrateo` |
| `reconexion.md` | Mapeo directo — causa `reconexion` |
| `fin-descuento.md` | Mapeo directo — causa `fin_descuento` |
| `orientacion-recibo.md` | Búsqueda vectorial (preguntas abiertas sobre cómo leer el recibo) |
| `notas-credito.md` | Búsqueda vectorial |
| `cambio-de-plan.md` | Búsqueda vectorial |
| `deuda-y-pagos.md` | Búsqueda vectorial |
| `campana-descuento-deuda.md` | Búsqueda vectorial |
| `fraccionamiento-deuda.md` | Búsqueda vectorial |
| `bloqueo-equipo.md` | Búsqueda vectorial |
| `movistar-total.md` | Búsqueda vectorial |
| `atencion-identidad.md` | Búsqueda vectorial |

Las 3 causas activas (prorrateo, reconexión, fin_descuento) usan resúmenes de este contenido real en vez del texto genérico inicial — probado contra cuentas reales. `reconexion.md` además incorpora el caso "descuento + corte combinados" del Módulo I. `orientacion-recibo.md` se amplió con 3 precisiones de lectura del recibo de la adenda (Deuda pasada no está en el detalle, el total agrupa todos los servicios, dónde están fecha de emisión/monto/vencimiento).

**Nota sobre la adenda (`kb-facturacion-movistar-m5-addendum.md`):** ~90% de esa fuente ya estaba cubierta por los documentos anteriores — su propio Anexo A hizo una verificación cruzada y confirmó sin contradicciones la tabla de ciclos y el mapa de datos del recibo ya extraídos. También redactó a propósito la matriz exacta de verificación de identidad por ser información sensible (tipo guía de ingeniería social) — `atencion-identidad.md` solo tiene la versión general, a propósito.

**Aviso de fiabilidad del Módulo I (`kb-facturacion-movistar-m4.md`):** es la fuente con más inconsistencias numéricas de la serie (la propia fuente lo advierte). Se extrajo priorizando estructura sobre cifras, tal como indica su sección de instrucciones — varios ejemplos de `movistar-total.md` no llevan montos a propósito. También hay un choque de datos entre fuentes: el cargo de reconexión referencial es S/ 7.42 en el Módulo 2 y S/ 6.00 en el Módulo I — ninguno es la tarifa vigente, y `reconexion.md` ya deja esto anotado.

**Hallazgo del Módulo 3 — posibles causas nuevas para el diff engine (no construidas, para decidir si vale la pena):** `FACTURACION-CLIENTES.csv` tiene una clasificación `Cargo Unico financiamiento` que podría detectar **"cuota de equipo financiado"** — uno de los 5 escenarios oficiales de las bases que no se construyó. También existe una línea `"Deuda pasada"` en el resumen del recibo que podría detectar un aumento por **deuda arrastrada**. Ninguna se evaluó todavía con datos reales (mismo proceso de auditoría que se hizo con prorrateo/reconexión/fin_descuento sería necesario antes de prometerlas para la demo).

**`kb-facturacion-movistar-m6.md` (descuento por alta/portabilidad, contado en días):** enriquece `fin-descuento.md` con el mecanismo exacto de por qué Renta Vencida deja un 4º recibo mixto y Renta Adelantada cierra en 3 recibos limpios — mismos días de beneficio, distinto reparto. También cierra un vacío que `-m2.md` había declarado irrecuperable (la analogía de los queques).

**⚠️ Conflicto sin resolver, señalado por la propia fuente como su hallazgo más importante:** `-m6.md` cuenta los días de un proporcional con una convención distinta a la regla PR-04 de `-m2.md` (un caso similar da 3 días en un documento y 4 en el otro). Anotado en `prorrateo.md` y `fin-descuento.md`. No afecta al diff engine (nunca calculamos proporcionales nosotros, solo leemos el CSV), pero **hay que resolverlo con el equipo de facturación antes de que el bot intente verificar o explicar un conteo de días por su cuenta**.

**Archivos internos NO indexados (por diseño):** `Database/OPERATIVO-INTERNO-no-indexar.md` y `-no-indexar_1.md` contienen rutas de sistemas internos (VISOR, +Simple, GENIO), guiones literales de asesor, y dos piezas de información sensible (el umbral antifraude de pago errado, y la combinación exacta de datos que valida a un usuario no titular sin DNI). Revisados y **descartados a propósito** — no tienen ningún archivo en `concepts/`. Si más adelante se quiere un bot interno para asesores, esta sería su fuente, pero como un sistema aparte con su propio control de acceso.

**Bloque C — Integración Gemini (líder técnico, en paralelo con B)**
1. `lib/gemini.ts`: wrapper para generación (con el prompt que prohíbe inventar montos) y para embeddings.
2. `lib/concept-retrieval.ts`: mapeo directo `CHARGE_CODE` → concepto; fallback a similitud coseno contra `data/embeddings.json`.
3. `app/api/chat/route.ts`: junta diff engine + concept retrieval + Gemini generation en un solo endpoint.

**Checkpoint de fin de Día 1:** se puede hacer un `curl`/Postman al endpoint `/api/chat` con una cuenta y una pregunta, y devuelve una explicación correcta y bien anclada a los datos.

**✅ Riesgo de cuota gratuita de Gemini — resuelto.** `gemini-flash-latest` tiene un límite gratuito de 20 requests/día por key/modelo, y llegó a agotarse durante el desarrollo (confirmado como agotamiento diario real, no cooldown corto). La mitigación intermedia fue rotar entre 3 keys (`GEMINI_API_KEY`, `_2`, `_3`); ahora que `GEMINI_API_KEY` tiene **facturación activa** en Google AI Studio/Cloud (sin límite de cuota gratuita), `lib/gemini.ts` volvió a usar una sola key — la rotación entre 3 keys ya no hace falta. `withKeyRotation` se mantiene igual por su reintento ante 503 (saturación transitoria del modelo), que sigue siendo útil con una sola key.

### Día 2 — UI, reglas de negocio y pulido

**Bloque D — Frontend — completo, integrado desde el repo de un compañero (`github.com/EdwardAR/HackatonAI_Desafio1`)**

En vez del frontend mínimo original, se portaron sus componentes (`Chat.tsx`, `BillingDashboard.tsx` = vista App Mi Movistar, `WhatsAppDemo.tsx`, `ui.tsx`) **sin modificarlos** — en su repo son solo proxies delgados hacia un backend FastAPI propio, así que en vez de reescribir sus componentes se adaptó la salida de nuestros propios endpoints al contrato de datos que ya esperaban:

- `app/api/chat/route.ts` — misma lógica interna (diff engine, cross-selling, sesiones, Gemini), pero serializa la respuesta en el formato de su `ChatResponse` (snake_case, `evidence` real por causa, `generated_by`, `conversation_id` autogenerado si no llega uno).
- `app/api/customers/route.ts` y `app/api/analysis/route.ts` — construidos desde cero (antes eran proxies a su FastAPI), sobre `compareInvoices()`/`getInvoicesForAccount()`, con 6 cuentas reales curadas (ver tabla).
- `app/dashboard/page.tsx` y `app/whatsapp/page.tsx` — páginas nuevas. Se dejó fuera a propósito su flujo de login OTP (`DemoAccess`/`/acceso`) — entra directo al dashboard, decisión reversible si se quiere sumar después.
- `lib/cross-selling.ts` — se le agregaron `price`/`code` a `CrossSellOffer` (su tarjeta de oferta los necesita).
- `app/globals.css` reemplazado por el suyo (diseño completo, ya traía sus propias clases — no chocaba con lo que teníamos).

Dependencias nuevas: `lucide-react`, `recharts`.

**Bloque E — Reglas de negocio (líder técnico)**
1. `lib/cross-selling.ts`: Regla 1 (fin de descuento) y Regla 2 (reconexión), solo se evalúan si la consulta quedó resuelta.
2. Next Best Action: decidir qué botones mostrar según el resultado del diff.
3. `HandoffSummary.tsx` + lógica de cuándo se dispara el hand-off.
4. "Efecto Efervescente": mensaje de cierre con 1-2 beneficios no usados.

**Bloque F — Ensayo y bonus (todo el equipo)**
1. Correr los 2 escenarios garantizados de punta a punta, varias veces, con distintas cuentas.
2. ~~Si hay tiempo: escenario bonus de fin de descuento~~ — **adelantado y ya implementado** (ver [FUNCIONALIDADES.md](./FUNCIONALIDADES.md) punto 8). Sigue siendo el más nuevo/menos ensayado de los 3, así que en el pitch prioricen prorrateo y reconexión como los "seguros".
3. Deploy a Vercel, probar la URL pública igual que se va a demostrar en el pitch.
4. Preparar el guion de los escenarios para el pitch (qué cuenta usar, qué se espera que diga el bot) — ahora hay 3 para elegir, no solo 2.

### Ronda extra — clasificador de sentimiento y acceso a cualquier cuenta (fuera de las fases originales)

**Clasificador de sentimiento (`lib/sentiment.ts`, fuente: `Database/prompt_analisis_sentimiento_claria.md`).** Llamada a Gemini independiente del motor de redacción (`gemini-flash-lite-latest`, reusa `withKeyRotation` de `lib/gemini.ts`) — ve solo el texto del mensaje del cliente, nunca el contexto financiero ni comparte sesión con la explicación. Devuelve `temperatura` (positiva/neutral/negativa/critica) + `confianza` + señales detectadas. Si falla por cualquier motivo, cae en "neutral" sin atención prioritaria — nunca rompe la respuesta principal.

Conectado al Gate de decisión en `app/api/chat/route.ts`, por encima de la clasificación de intención por palabras clave (`lib/intent.ts`):
- **Crítica** → hand-off inmediato (`reason: "cliente_critico"`), sin oferta comercial, sin importar en qué turno de la conversación aparezca — con la temperatura/confianza/señales incluidas en el contexto del hand-off.
- **Negativa con confianza ≥ 0.75** → si ya se explicó algo y el cliente sigue en ese tono, dispara hand-off (`reason: "cliente_negativo_persistente"`) igual que "confundido"/"quiere asesor", y bloquea cross-selling en el turno de cierre aunque la regla de negocio lo habilitaría.
- **Neutral/Positiva** → flujo estándar, sin bloqueos adicionales.
- El campo `tone` de la respuesta ahora refleja siempre la clasificación real (antes era un valor fijo/heurístico).

Probado en vivo contra el endpoint real con los 4 casos: mensaje crítico → hand-off inmediato; mensaje negativo persistente sin ninguna palabra clave de "confundido"/"asesor" → hand-off igual, disparado solo por sentimiento; mensaje neutral → flujo normal con Gemini; mensaje positivo en turno de cierre → cross-sell se ofrece con normalidad. Los 4 devolvieron el `tone` correcto y el contexto de sentimiento quedó anclado en `handoff.context`.

**Acceso a cualquier cuenta real, no solo las 6 curadas (`BillingDashboard.tsx`).** Antes el dashboard solo mostraba las 6 cuentas curadas de `/api/customers`, con fallback silencioso a la primera si el ID pedido no estaba ahí. Se agregó un input libre ("O ingresa cualquier cuenta real") que llama al mismo `selectCustomer()` que los botones de escenario — reusa el `useEffect` que pide `/api/analysis?customer_key=...` y el mismo `Chat` recibe ese `customerKey`. Si la cuenta no está en la lista curada, el nombre/escenario mostrado cae a una etiqueta genérica (`Cliente {id}`) en vez de mostrar por error la identidad de otro cliente.

Nota de datos: el identificador que espera toda la API (`customer_key`) es en realidad `FINANCIAL_ACCOUNT_KEY` de `FACTURACION-CLIENTES.csv`, no `CUSTOMER_KEY` — así estaba diseñado el diff engine desde el Bloque A (las 6 cuentas curadas ya eran valores de esa columna). Probado con una cuenta real fuera de las 6 curadas (`749286974`, un caso de cambio de plan con 80 líneas en el CSV) contra `/api/analysis` y `/api/chat` — ambos devuelven datos reales y coherentes. Verificado a nivel de API + revisión del wiring en React; **no se probó visualmente en navegador** (sin herramienta de automatización de navegador disponible en esta sesión).

**Landing con ID antes de elegir destino (`app/page.tsx`).** El selector de cuenta ya no vive solo dentro de cada superficie — la portada ahora pide el ID antes de entrar y lo pasa por query string (`?customer_key=...`) a `/dashboard` o `/whatsapp`. Ambas páginas se envolvieron en `Suspense` (lo exige `useSearchParams`). `BillingDashboard.tsx` usa ese ID como semilla sin que el fetch de cuentas curadas lo pise. `WhatsAppDemo.tsx` salta el paso de verificación simulada (teléfono/OTP falso) cuando el ID llega desde la landing, y ya no cae por error en la identidad de otro cliente si ese ID no está en la lista curada. Verificado con `tsc --noEmit` limpio y las 5 rutas devolviendo 200 sin errores en el log del servidor; **no probado visualmente en navegador** (misma limitación que el resto de la UI en esta sesión).

## Pendientes fuera del checklist (no bloquean el MVP, quedan como stretch)

- **2 causas nuevas posibles para el diff engine** (`Cargo Unico financiamiento` → cuota de equipo financiado; línea `"Deuda pasada"` → deuda arrastrada): identificadas en el Módulo 3, nunca evaluadas con datos reales. **Decisión del equipo: se dejan para más adelante** — ya hay suficientes escenarios (3) para mostrar que el enfoque funciona.
- **Vista estilo "recibo real" (PDF-like)** en el frontend: discutida, no iniciada — sería un componente de presentación nuevo sobre los mismos datos ya verificados, sin pipeline nuevo. Pulido de pitch, no funcionalidad faltante.
- **Conflicto de conteo de días** entre `-m6.md` y la regla PR-04 de `-m2.md` (prorrateo/fin de descuento): no afecta al diff engine hoy (nunca calculamos días, solo leemos el CSV), pero hay que resolverlo con el equipo de facturación antes de que el bot intente verificar un conteo de días por su cuenta.

### Ronda extra 2 — capa vectorial de conceptos

**`scripts/build-embeddings.ts` (nuevo).** Lee los 12 archivos de `concepts/*.md`, genera un embedding por archivo completo (sin chunking — son textos cortos, 20-119 líneas c/u) con `gemini-embedding-001` vía `embedText()` de `lib/gemini.ts`, y escribe `data/embeddings.json` (524 KB, se commitea — liviano, no pesa en el deploy). Se corre una sola vez con `npm run build-embeddings` y se vuelve a correr solo si cambia algún `.md` de `concepts/`.

Nota técnica encontrada al armarlo: el patrón `import { config } from "dotenv"; config(...)` **no garantiza que las env vars estén listas antes que los demás `import`** — TypeScript hoistea todos los `import` (incluido el de `lib/gemini.ts`, que lee `process.env.GEMINI_API_KEY` al cargar el módulo) por encima de cualquier otra instrucción, sin importar el orden en el código fuente. Mismo bug ya existía en `scripts/test-gemini.ts`. Se arregló corriendo con `tsx --env-file=.env.local` (carga las env vars a nivel de proceso, antes de que Node empiece a resolver imports) en vez de confiar en el orden del código — así quedó el script de `package.json`.

**`lib/concept-retrieval.ts`.** Nueva función `searchConcepts(query)`: embebe la pregunta del cliente, calcula similitud coseno contra los 12 vectores de `data/embeddings.json`, devuelve los que superen 0.5 de similitud (máximo 2). Nunca lanza — si falla el embedding (cuota, red), devuelve `[]` y el resto de la respuesta sigue funcionando igual, mismo patrón defensivo que `classifySentiment`.

**`app/api/chat/route.ts`.** La búsqueda vectorial corre siempre en el flujo normal (no solo cuando el diff engine no encuentra causa) — así cubre preguntas generales tipo "¿qué es Movistar Total?" en una cuenta que además tiene una causa detectada, sin que la pregunta real quede sin responder. `hasConceptMatch` ahora participa donde antes solo se miraba `hasCauses`: habilita la llamada a Gemini, cuenta como "ya expliqué algo" para el Gate de turnos de cierre/hand-off, y evita el botón de "derivar_asesor" cuando sí hubo una respuesta real. El mensaje estático de último recurso (`getFallbackConceptExplanation`) solo aparece ahora si ni el diff engine ni la búsqueda vectorial encontraron nada.

Probado en vivo contra el endpoint real con preguntas de 3 conceptos antes inertes (Movistar Total, notas de crédito, fraccionamiento de deuda) — las 3 devolvieron respuestas reales y correctas citando datos concretos del `.md` correspondiente (ej. "hasta 6 cuotas sin intereses", "página 3 de tu recibo"), no el texto genérico de antes. Probado también que una pregunta sin relación (ej. "¿cuál es la capital de Francia?") no dispara un match falso — el bot correctamente dice que no tiene esa información.

### Ronda extra 3 — git, deploy y documentación final

**Vercel vs. Cloud Run.** Se evaluó Cloud Run como alternativa — es viable (Next.js soporta `output: "standalone"`, Cloud Run puede construir directo desde el código fuente) y con `min-instances: 1` mitigaría los dos riesgos de despliegue mencionados arriba (CSV de 60MB parseado una sola vez, sesión en memoria persistente de forma confiable), a cambio de pagar por una instancia siempre activa en vez de escalar a cero. Decisión: arrancar por Vercel (más simple, más rápido a una URL pública) usando el repo `https://github.com/Ismaelrojas0112/TelecomAI.git`; Cloud Run queda como opción documentada si hace falta más adelante.

**🚧 Bloqueado: primer commit + push al repo.** Se conectó el remoto (`git remote add origin ...`) y se armó el commit (60 archivos, todo el build de este proyecto — nunca se había subido nada más allá del scaffold inicial de `create-next-app`). Tanto `git commit` como `git push` fueron rechazados por el clasificador de permisos automático del entorno (acción "denied by the Claude Code auto mode classifier" — bloquea proactivamente operaciones de git que tocan estado compartido/remoto). **Sigue pendiente que el usuario corra esto manualmente** (o ajuste el permiso de Bash para permitirlo):
```
git remote add origin https://github.com/Ismaelrojas0112/TelecomAI.git   # ya se corrió una vez, puede fallar con "already exists" — ok
git add -A
git commit -m "Build completo del MVP: diff engine, RAG en 2 capas, gate de sentimiento y frontend"
git push -u origin main
```
Después de esto: conectar el repo en Vercel, configurar `GEMINI_API_KEY` como variable de entorno del proyecto, deployar, y probar la URL pública — prestando especial atención a los dos riesgos ya conocidos (tiempo de cold start con el CSV de 60MB, consistencia de la sesión en memoria entre requests).

**Documentación actualizada para reflejar el estado real:** [FUNCIONALIDADES.md](./FUNCIONALIDADES.md), [FRONTEND.md](./FRONTEND.md) (reescrito — ya no es spec para construir, describe el frontend adoptado tal como quedó), [FLUJO-INFORMACION.md](./FLUJO-INFORMACION.md), [PRD.md](./PRD.md) e [INVESTIGACION-DESAFIO1.md](./INVESTIGACION-DESAFIO1.md). Nuevos, para el pitch: [FLUJO-BOT-MERMAID.md](./FLUJO-BOT-MERMAID.md) (diagrama as-built completo), [CONTENIDO-PPT.md](./CONTENIDO-PPT.md) (contenido diapositiva por diapositiva) y [PITCH.md](./PITCH.md) (guion hablado, ~4 min, con las cuentas de demo a usar).

## Definición de "hecho" (checklist antes del pitch)

- [x] Los 2 escenarios garantizados funcionan de punta a punta, con datos reales de los CSV (+ el bonus de fin de descuento, adelantado).
- [x] Ningún monto/fecha en las respuestas viene "inventado" por el LLM — todo trazable al diff engine (probado con fallback si Gemini falla).
- [x] Las 2 superficies de UI muestran la misma explicación para la misma cuenta — `/dashboard` (App Mi Movistar) y `/whatsapp`, ambas sobre el mismo `Chat.tsx` y el mismo `/api/chat`. Probado por curl; falta un pase visual completo en navegador antes del pitch.
- [x] El hand-off muestra un resumen con datos reales de la conversación, no un texto fijo.
- [x] Las 2 reglas de cross-selling se pueden disparar en vivo (probadas ambas).
- [x] El clasificador de sentimiento maneja el Gate (crítica → hand-off forzado, negativa persistente → hand-off + bloqueo de cross-sell) — probado en vivo contra el endpoint real.
- [x] Se puede consultar cualquier cuenta real del dataset desde el dashboard, no solo las 6 curadas — probado por API, falta pase visual en navegador.
- [x] Se puede entrar con un ID desde la landing y llega ya cargado a `/dashboard` o `/whatsapp`, saltando la verificación falsa — probado por `tsc`/API, falta pase visual en navegador.
- [x] Capa vectorial de conceptos activa — los 12 archivos de `concepts/` alimentan al bot (3 por mapeo directo, 9 por búsqueda semántica). Probado en vivo con 3 conceptos antes inertes.
- [x] Cuota de Gemini resuelta — facturación activa en `GEMINI_API_KEY`, ya no depende de rotación entre keys del free tier.
- [ ] **Pase visual completo en navegador real** de las 3 superficies (landing, dashboard, whatsapp) — todo lo de esta sesión se probó por `curl`/`tsc`/lectura de código, nunca se abrió en un navegador de verdad. Es el hueco de verificación más grande ahora mismo.
- [ ] La app está deployada en una URL pública y se probó ahí — **bloqueado en el primer paso:** el `git commit`/`push` al repo lo rechazó el clasificador de permisos del entorno, hay que correrlo a mano (comandos exactos arriba, en "Ronda extra 3").
- [ ] Plan B visual si Gemini falla en pleno pitch (screenshot/video de respaldo) — menos urgente ahora que hay facturación activa, pero sigue siendo buena práctica tenerlo.
