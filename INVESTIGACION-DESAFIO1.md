# Investigación y enfoque de solución — Desafío 1

Notas de investigación y propuesta de arquitectura recopiladas para planificar el prototipo. Complementa a [DESAFIO1.md](./DESAFIO1.md) (bases oficiales del reto).

## El ecosistema real de Movistar

- La operación actual se apoya en el sistema **BrainyBill**, que expone la información de la factura vigente y de los 5 recibos previos.
- **CRM Amdocs** contiene el historial de órdenes del cliente.
- Canales digitales involucrados: **App Mi Movistar**, **Bot Lucía** y **WhatsApp Movistar**. Hoy estos canales muestran los datos pero no explican las causas de las variaciones.

## Enfoque de la propuesta e interfaz interactiva

- Estructurar la solución como un **microservicio de IA independiente en el backend** que procese la lógica financiera y conversacional de forma centralizada.
- Para la demo interactiva, replicar una interfaz similar a la App Mi Movistar o un chat tipo WhatsApp / Bot Lucía, permitiendo al jurado ver la experiencia del usuario final en tiempo real.

## Motor de cálculo determinista (Diff Engine)

- Programar un algoritmo en backend que compare matemáticamente el recibo actual frente a los recibos anteriores para aislar la causa exacta de variación (prorrateos, fin de promociones, reconexiones o cuotas de equipos).
- Este cálculo matemático previo garantiza un **0% de alucinaciones financieras**, evitando que el modelo de lenguaje invente o deduzca montos.

## RAG y traducción a lenguaje cliente

- Implementar una arquitectura RAG conectada a la base de reglas de facturación y al catálogo de conceptos de Movistar.
- El modelo generativo usa ese contexto para traducir tecnicismos fiscales o regulatorios complejos a explicaciones cotidianas, empáticas y transparentes.

## El "Efecto Efervescente"

- Incorporar una regla de cierre que recuerde proactivamente al cliente los beneficios y diferenciales que ya incluye su plan actual y que no está utilizando.
- Refuerza el valor percibido del servicio contratado sin presentarlo como una venta o adición nueva.

## Cross-selling restrictivo y ético

- El motor comercial solo puede ofrecer un producto adicional si la consulta del recibo fue resuelta positivamente **y** existe una regla de negocio explícita que lo habilite.
- Si el usuario sigue insatisfecho o con dudas, la IA tiene **prohibido** lanzar promociones y debe priorizar la ayuda.
- Los asistentes deben tener claros los tipos de beneficios y sus límites (ej. no se podría dar un descuento del 100%).

## Derivación inteligente a humanos (Hand-off con contexto)

- Cuando la consulta supera el alcance de facturación o el cliente no comprende la explicación, el sistema transfiere la atención a un asesor de Call Center o WhatsApp.
- La transferencia debe enviar un **resumen estructurado** (payload de contexto con montos y motivos) para que el asesor continúe la atención sin hacer repetir datos al cliente.

## Demostración obligatoria en vivo

El prototipo debe demostrar en vivo el procesamiento exitoso de **al menos dos escenarios críticos** inyectados en la data sintética, a elegir entre:

- Prorrateo por cambio de plan.
- Fin de descuento promocional.
- Cobro por reconexión tras suspensión morosa.
- Facturación de cuota de equipo financiado.
- Cambio de plan (renta adelantada y vencida).

## Funcionalidades propuestas para el asistente

- **Explicación visual interactiva:** tarjetas enriquecidas, gráficos de barras comparativos, desglose visual de las 3 causas principales del cambio y botones interactivos para profundizar sin escribir.
- **Memoria de contexto (Stateful Reasoning):** el asistente recuerda toda la conversación (ej. "ese cargo" se resuelve sin repetir datos).
- **Explicación predictiva y preventiva:** anticipa el futuro (ej. avisa si un descuento finaliza el próximo mes) y ofrece opciones para evitar sorpresas, fomentando retención.
- **Traductor de jerga a escenarios reales:** convierte términos técnicos (ej. "prorrateo") en narrativas cotidianas ligadas a acciones concretas del cliente (ej. "pagaste mitad y mitad por tu cambio de plan").
- **Clasificador de emociones y ajuste de tono:** detecta si el cliente está enojado o confundido y adapta el tono (disculpativo + derivación a humano si está molesto; didáctico + ejemplos si está perdido). **✅ Implementado** — `lib/sentiment.ts`, clasificador independiente (positiva/neutral/negativa/crítica) conectado al Gate de decisión: crítica fuerza hand-off inmediato sin oferta comercial, negativa persistente dispara hand-off y bloquea cross-selling. Ver detalle en [FUNCIONALIDADES.md](./FUNCIONALIDADES.md) punto 11.

## Puntos clave a considerar en el prototipo

- **Escenarios a demostrar** (elegir al menos 2): prorrateo por cambio de plan, fin de descuento promocional, cobro por reconexión tras suspensión, facturación de cuota de equipo financiado, cambio de plan (renta adelantada y vencida).
- **Seguridad:** simular autenticación y no exponer datos sensibles.
- **Hand-off:** si el asistente no puede resolver, derivar a un asesor humano con el contexto de la conversación.
- **Cross-selling:** solo si la consulta se resuelve satisfactoriamente y existe una regla de negocio que lo habilite.

## Los 5 pilares explícitos de las bases del desafío

1. **Arquitectura técnica:** NLP + RAG (Generación Aumentada por Recuperación).
2. **La regla de oro — 0% de alucinaciones:** el asistente nunca debe inventar un cargo, un monto o una fecha. Es el requisito más estricto.
3. **Capacidades analíticas (comparativa):** lógica interna para comparar automáticamente el recibo actual con los 5 recibos previos. Debe detectar diferencias en códigos de cargo (`CHARGE_CODE`), fechas, montos y descuentos, y clasificar la causa del cambio (ej. "se acabó tu descuento del 20%", "tuviste un prorrateo por cambio de plan", "pagaste reconexión").
4. **Motor de recomendación de acciones (Next Best Action):**
   - Si la duda se resuelve → ofrecer pagar o ver el detalle.
   - Si la duda es compleja → hand-off inteligente con todo el contexto de la conversación.
   - Cross-selling restrictivo: solo si la consulta se resolvió con éxito **y** hay una regla de negocio explícita, nunca de forma invasiva. Al terminar la interacción, recordar al cliente el valor total de sus beneficios contratados para mitigar la percepción de costo elevado.
5. **Experiencia omnicanal y segura:** debe funcionar en App Mi Movistar y WhatsApp, bajo un esquema Zero Trust — datos sensibles (DNI, teléfono) solo se muestran si el cliente está autenticado. El prototipo se construye con datos sintéticos para garantizar la privacidad.

## Decisión abierta: modelo de predicción (regresión / ML)

Propuesta del equipo: evaluar si añadir un modelo de regresión lineal o ML que prediga si el próximo recibo llegará más caro.

**Recomendación de planificación:** dejarlo fuera del núcleo del mockup. La "explicación predictiva y preventiva" que sí piden las bases se puede resolver con reglas deterministas sobre la misma data (fin de promociones, cuotas pendientes) sin comprometer el pilar de 0% alucinaciones. Si sobra tiempo, se puede sumar como extra visual (ej. tendencia estimada), claramente separado y etiquetado como estimación, del motor de explicación determinista.
