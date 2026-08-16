# PRD — Asistente de Explicación de Recibos (Desafío 1)

Ver problemática completa en [DESAFIO1.md](./DESAFIO1.md) y la investigación/propuesta en [INVESTIGACION-DESAFIO1.md](./INVESTIGACION-DESAFIO1.md). Este documento define qué vamos a construir en los 2 días que tenemos antes del pitch.

## Resumen ejecutivo

Un asistente conversacional que explica, en lenguaje simple, por qué el recibo de un cliente varió respecto a meses anteriores — comparando su factura actual contra las 5 previas, identificando la causa exacta (prorrateo, reconexión, fin de descuento, etc.) y ofreciendo una siguiente acción clara. Corre embebido en dos superficies (estilo App Mi Movistar y estilo WhatsApp) sobre un mismo motor de chat.

## Objetivo del prototipo

Pasar el corte de esta fase del hackathon demostrando **en vivo** que el asistente resuelve al menos 2 escenarios reales de variación de recibo, sin inventar ni un solo monto. No es un producto de producción: es un mockup con datos sintéticos y componentes simulados donde el bases del desafío lo permite (autenticación, canales), pero con lógica de negocio real donde importa (cálculo de variación, reglas de cross-selling).

**Plazo:** 2 días. **Equipo:** 4 personas, 1 liderando la parte técnica, resto delegable.

## Usuarios objetivo (para la demo)

Un cliente de Movistar que entra a la App Mi Movistar o le escribe al bot de WhatsApp con dudas sobre por qué su recibo cambió de precio.

## Alcance

Detalle completo de features en [FUNCIONALIDADES.md](./FUNCIONALIDADES.md). Resumen:

**Incluido:**
- Explicación conversacional de variaciones de recibo para 3 escenarios (prorrateo, reconexión, fin de descuento) — los 2 garantizados por las bases más el bonus, los 3 implementados y probados.
- Motor de diff determinista sobre los CSV de facturación sintética.
- RAG en dos capas: retrieval determinista (montos/fechas) + retrieval vectorial (12 conceptos curados de Academia Movistar, vía Gemini embeddings — activa, no solo planeada).
- Generación de la explicación final vía Gemini (LLM real, no scripteado).
- Clasificador de sentimiento independiente (positiva/neutral/negativa/crítica) que prioriza el hand-off automático y bloquea cross-selling ante un cliente molesto — no era un requisito de las bases, se sumó como refuerzo del pilar de "claridad, empatía y transparencia".
- Next Best Action: pagar / ver detalle / cross-selling restrictivo / derivar a asesor.
- 2 reglas de cross-selling concretas, ancladas al catálogo de ofertas.
- Hand-off con vista de resumen/contexto real para el asesor simulado (incluye la clasificación de sentimiento cuando fue el disparador).
- "Efecto Efervescente": recordatorio de beneficios no usados al cerrar una interacción resuelta.
- Autenticación simulada (selector de cliente o ID libre en la vista App; número de teléfono + verificación mínima en WhatsApp — o directo al chat si el ID ya se ingresó en la landing).
- Landing con selector de cuenta: se puede consultar cualquier cuenta real del dataset, no solo las curadas para la demo.
- Tres superficies de UI sobre el mismo motor de chat: landing, vista tipo App Mi Movistar y skin tipo WhatsApp.

**Explícitamente fuera de alcance para estos 2 días** (con motivo):
- **Modelo de predicción ML/regresión** del próximo recibo — descartado para no arriesgar el pilar de 0% alucinaciones (detalle en [INVESTIGACION-DESAFIO1.md](./INVESTIGACION-DESAFIO1.md)).
- **Integración real con WhatsApp Business API** — el motor de chat ya queda listo para conectarse después vía un adaptador; no es necesario para demostrar la idea.
- **Base de datos / vector store en la nube** — todo corre local (CSV + MD + embeddings empaquetados en el deploy) para minimizar puntos de falla en la demo en vivo. Ver justificación en [FLUJO-INFORMACION.md](./FLUJO-INFORMACION.md).
- **Conexión real a BrainyBill / CRM Amdocs** — se usan los CSV sintéticos entregados; la arquitectura queda preparada para enchufar la fuente real después sin rediseñar el motor.
- **Ver recibos de otras líneas** — solo se contempla como idea de roadmap (múltiples líneas bajo la misma cuenta financiera es legítimo; ver otra cuenta financiera distinta no lo es, por Zero Trust).
- **Automatizar la extracción de PDF/PPTX a texto** — para esta versión, el equipo cura manualmente el contenido de los materiales de Academia Movistar a Markdown. Se menciona como mejora futura en el pitch.

## Requisitos no negociables (vienen de las bases del desafío)

1. **0% de alucinaciones**: ningún monto, fecha o código de cargo puede salir de una llamada al LLM sin haber sido calculado primero por el motor determinista.
2. **Zero Trust simulado**: no se muestra ningún dato sensible sin que el "cliente" esté identificado/autenticado (aunque sea de forma simulada).
3. **Cross-selling restrictivo**: solo se ofrece algo si la consulta se resolvió positivamente y existe una regla de negocio explícita que lo habilite.
4. **Omnicanalidad**: la misma lógica debe funcionar detrás de las dos superficies de UI.

## Qué se demuestra en vivo en el pitch

- Un cliente con una reconexión reciente pregunta por qué le subió el recibo → el bot identifica el cargo exacto, lo explica comparando contra el mes anterior, ofrece next best action y (si aplica) el cross-selling de la Regla 2.
- Un cliente nuevo (recién activado) pregunta por qué su primer recibo tiene un monto raro → el bot explica el prorrateo **sin comparar contra nada** (es su primer recibo), mostrando cómo se calculó proporcional a los días. Ver la aclaración de por qué este escenario es distinto en [FUNCIONALIDADES.md](./FUNCIONALIDADES.md).
- Un caso donde el bot no puede resolver → hand-off con el resumen de contexto visible.
- (Bonus, si hay tiempo) un caso de fin de descuento promocional.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Falla de red/API en pleno pitch | Todo corre local salvo la llamada a Gemini; código con fallback determinista automático si Gemini falla. Sigue faltando el respaldo visual (screenshot/video) para el pitch en sí — ver checklist en [PLAN-IMPLEMENTACION.md](./PLAN-IMPLEMENTACION.md) |
| ~~Cuota gratuita de Gemini (20 req/día) se agota en pleno desarrollo/pitch~~ | **Resuelto** — facturación activa en la API key principal, sin límite de cuota gratuita |
| Data de `Ordenes.csv` (cambio de plan) tiene categorías ambiguas (no hay un valor explícito "cambio de plan") | Por eso no es uno de los escenarios garantizados — el concepto sí se explica por búsqueda vectorial si el cliente pregunta, pero no es una causa detectada por el diff engine |
| Curación manual de MD toma más tiempo del esperado | Se priorizaron primero los 3 escenarios activos; terminaron cubriéndose los 12 conceptos entregados |
| Cuatro personas, un solo líder técnico | Front-end (las 2 skins) y curación de contenido MD son delegables sin tocar el motor determinista |
| Estado de conversación en memoria (`lib/session-store.ts`) no sobrevive de forma garantizada entre instancias en un deploy serverless | Riesgo aceptado para el MVP — ver nota de Vercel/Cloud Run en [PLAN-IMPLEMENTACION.md](./PLAN-IMPLEMENTACION.md) |
