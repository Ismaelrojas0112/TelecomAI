# Contenido para las diapositivas

Material fuente para armar la PPT — no es el diseño final, es qué decir y mostrar en cada slide. Guion de palabras para el pitch en vivo: [PITCH.md](./PITCH.md). Diagrama técnico completo: [FLUJO-BOT-MERMAID.md](./FLUJO-BOT-MERMAID.md).

Nombres: **BotULima** es el nombre del proyecto/equipo para el hackathon. **ClarIA** es el nombre del asistente dentro de la interfaz (así aparece en el header de la app y de WhatsApp) — usar ClarIA cuando se hable del producto en pantalla, BotULima para el proyecto/equipo.

---

## Slide 1 — Portada

- **Título:** ClarIA — el asistente que explica tu recibo, no solo te lo muestra
- **Subtítulo:** Desafío 1: Atención inteligente y explicación de recibos — BotULima
- Logo/mark: el ícono "C" turquesa-azul ya usado en la app.
- Visual sugerido: captura de la hero card del dashboard (monto + variación + causa).

---

## Slide 2 — El problema (con los números reales del desafío)

- **+5 millones** de recibos emitidos al mes.
- **~40%** presenta variación de monto de un mes a otro.
- **+200 mil llamadas mensuales al 104** solo por dudas de facturación.
- La App Mi Movistar ya registra **+1.5 millones de interacciones** de recibo al mes — pero **solo muestra el documento, nunca explica por qué cambió.**
- Frase ancla: *"El cliente no llama porque no sabe pagar. Llama porque no entiende cuánto le están cobrando."*

---

## Slide 3 — Por qué esto importa (impacto de negocio)

- Cobro percibido como "excesivo" → cae el NPS → sube el riesgo de baja (churn).
- Cada llamada evitable tiene un costo operativo directo y repetible mes a mes.
- Metas que el desafío pide mover: -15% llamadas call center/WhatsApp, +10% NPS transaccional y digital, -5% reclamos por facturación, más autogestión digital.

---

## Slide 4 — La solución en una frase

- **ClarIA compara tu recibo actual contra los anteriores, encuentra la causa exacta del cambio, y te lo explica en lenguaje simple — con evidencia real, no una suposición del modelo.**
- 3 pilares no negociables (vienen de las bases del desafío, se muestran como compromiso, no como opción):
  1. **0% alucinaciones** — ningún monto sale de la IA, todo se calcula antes.
  2. **Zero Trust** — nunca se muestra un dato sin cuenta identificada.
  3. **Omnicanal** — misma lógica en App Mi Movistar y WhatsApp.

---

## Slide 5 — Cómo funciona (arquitectura, versión simple para el jurado)

Visual sugerido: versión simplificada del diagrama de [FLUJO-BOT-MERMAID.md](./FLUJO-BOT-MERMAID.md) (3-4 cajas, no el diagrama técnico completo).

- **1. Motor determinista (el diff engine):** lee el recibo actual y los 5 anteriores directo del CSV de facturación, calcula la diferencia exacta, identifica el cargo que cambió. Esto nunca lo toca la IA — es matemática simple sobre datos reales.
- **2. Motor de conocimiento (RAG en 2 capas):** 3 causas ya conocidas (reconexión, prorrateo, fin de descuento) se mapean directo a su explicación curada; para preguntas más generales ("¿qué es Movistar Total?", "¿puedo fraccionar mi deuda?") se busca por significado entre 12 documentos de conocimiento reales de Movistar.
- **3. Gemini solo redacta:** toma los números ya calculados + el concepto ya encontrado, y arma una respuesta clara y empática — nunca inventa ni ajusta una cifra.
- Frase ancla: *"La IA nunca calcula. La IA nunca decide. La IA explica lo que el motor determinista ya calculó."*

---

## Slide 6 — Diferenciador: entiende cómo te sentís, no solo lo que preguntás

- Clasificador de sentimiento independiente (positiva / neutral / negativa / crítica) — analiza el tono del mensaje, no los datos financieros.
- Si detecta un cliente **crítico** (enojado, amenaza con darse de baja, menciona Indecopi) → deriva a un asesor humano **de inmediato**, con el contexto completo, sin ofrecerle nada.
- Si el cliente sigue negativo después de una explicación → deriva también, y bloquea cualquier oferta comercial.
- No estaba en las bases del desafío — se sumó porque un cliente molesto no necesita una oferta, necesita que lo escuchen.

---

## Slide 7 — Diferenciador: funciona con cualquier cuenta, no solo casos armados

- Landing de entrada: se puede ingresar el ID de **cualquier cuenta real del dataset**, no solo las curadas para la demo.
- Útil para el jurado: pueden pedir "prueben con esta otra cuenta" en vivo y el bot responde igual de bien, sin datos precargados a mano.
- Refuerza que el 0% alucinaciones no es solo para los 3 casos ensayados — es la arquitectura completa.

---

## Slide 8 — Demo en vivo: los 3 escenarios

| Escenario | Qué pregunta el cliente | Qué encuentra el motor |
|---|---|---|
| **Reconexión** | "¿Por qué me llegó más caro?" | Cargo por reactivación tras un corte por falta de pago — con fecha de corte y de reconexión reales |
| **Prorrateo (primer recibo)** | "¿Por qué mi primer recibo es por este monto?" | No hay recibo anterior — es cobro proporcional a los días desde la activación, no un cobro de más |
| **Fin de descuento** *(bonus)* | "¿Por qué subió si no cambié nada?" | Un descuento temporal venció — el recibo vuelve al monto normal del plan |

- Cada respuesta muestra **evidencia real**: tabla, campo y valor exacto de donde salió la cifra — un botón "ver fuente del cálculo" en cada causa.
- Guion detallado de qué cuenta usar y qué decir en cada uno: [PITCH.md](./PITCH.md).

---

## Slide 9 — Next Best Action y cierre inteligente

- Tras resolver la duda: botones para pagar, ver el detalle, o hablar con un asesor.
- **Cross-selling restrictivo:** solo se ofrece algo si la consulta se resolvió Y existe una regla de negocio explícita — nunca de forma invasiva, nunca si el cliente sigue molesto o confundido.
- **"Efecto Efervescente":** al cerrar, recuerda un beneficio real que el cliente ya tiene y quizás no está usando — refuerza valor percibido sin vender nada nuevo.
- **Hand-off con contexto real:** si el bot no puede resolver, el asesor recibe un resumen real (motivo, montos, causas, y la conversación ya sostenida) — el cliente no repite nada.

---

## Slide 10 — Stack técnico (para preguntas del jurado)

- **Next.js 16 / React 19** — una sola app, frontend + backend.
- **Gemini** — `gemini-flash-latest` para redactar explicaciones, `gemini-flash-lite-latest` para clasificar sentimiento (llamada independiente, no comparte contexto), `gemini-embedding-001` para la búsqueda vectorial.
- **Sin base de datos externa** — los CSV son la fuente de verdad, se leen directo; los embeddings se calculan una sola vez y se empaquetan con el deploy.
- Resiliencia: si Gemini falla, hay una respuesta de respaldo determinista — nunca se cae la conversación.

---

## Slide 11 — Roadmap (lo que sigue, no lo que falta)

- Conexión real a BrainyBill / CRM Amdocs en vez de CSV locales.
- Integración real con WhatsApp Business API.
- 2 causas adicionales identificadas y listas para evaluar: cuota de equipo financiado, deuda arrastrada.
- Automatizar con IA la extracción de material de capacitación (PDF/PPTX) a base de conocimiento, hoy curada a mano.
- Vista de recibo con formato de documento real (PDF-like), además del dashboard actual.

---

## Slide 12 — Cierre

- Frase de cierre: *"No construimos un chatbot que responde preguntas sobre facturación. Construimos un motor que nunca miente sobre un monto, y una IA que solo lo explica."*
- Equipo BotULima — agradecimiento.
- (Si aplica) URL pública de la demo desplegada.
