# Guion del pitch

Guion hablado para presentar en vivo. ~4 minutos de texto (ajustar según el tiempo asignado — las secciones marcadas [RECORTABLE] son las primeras en cortar si sobra poco tiempo). Las cuentas de demo están verificadas contra los CSV reales — ver la tabla completa en [FUNCIONALIDADES.md](./FUNCIONALIDADES.md). Contenido de las diapositivas: [CONTENIDO-PPT.md](./CONTENIDO-PPT.md).

**Antes de empezar:** tener `/dashboard` ya abierto en una pestaña (o la URL pública si ya está deployada), con la cuenta de reconexión cargada. Si algo de Gemini falla en vivo, el sistema cae solo a una respuesta de respaldo — seguir hablando con naturalidad, no es un error visible para el jurado, es la resiliencia funcionando.

---

## 1. El gancho (20 segundos)

> Movistar emite más de 5 millones de recibos al mes. Cerca del 40% de esos recibos varía de un mes a otro. Y cuando un cliente ve ese cambio, no llama porque no sepa pagar — llama porque no entiende cuánto le están cobrando y por qué. Eso son más de 200 mil llamadas al mes solo por esto.
>
> La app Mi Movistar ya le muestra al cliente su recibo actual y los 5 anteriores. Pero solo se los muestra. Nunca se los explica.

**[ACCIÓN: pantalla en blanco o logo, sin mostrar la app todavía]**

---

## 2. La solución en una frase (15 segundos)

> Nosotros construimos ClarIA: un asistente que compara tu recibo actual contra los anteriores, encuentra la causa exacta del cambio, y te la explica en un lenguaje simple — con evidencia real detrás de cada número, no una suposición de la IA.

**[ACCIÓN: mostrar la portada/landing]**

---

## 3. Demo en vivo — Escenario 1: Reconexión (45 segundos)

> Les muestro con una cuenta real del dataset. Este cliente tuvo su servicio suspendido por falta de pago y después se reconectó.

**[ACCIÓN: entrar con la cuenta `104180441`, o hacer clic en la tarjeta de "Reconexión" del selector]**

> "¿Por qué me llegó más caro este mes?"

**[ACCIÓN: escribir esa pregunta en el chat]**

> Vean que responde con el monto exacto — S/.4.58 — la fecha de corte y la fecha de reconexión, y una explicación en lenguaje simple de por qué existe ese cargo. Y si el jurado no me cree, acá está el botón "ver fuente del cálculo": esto no lo inventó la IA, es la fila exacta del sistema de facturación.

**[ACCIÓN: abrir la evidencia de la causa, mostrar tabla/campo/valor]**

---

## 4. Demo en vivo — Escenario 2: Prorrateo (35 segundos) [RECORTABLE]

> Segundo caso, distinto tipo de duda: un cliente recién activado.

**[ACCIÓN: cambiar a la cuenta `761895720`]**

> Este es su primer recibo — S/.79.79 — y no hay un recibo anterior con qué compararlo. Acá el bot no dice "subió" ni "bajó", porque no corresponde: explica que es un cobro proporcional a los días que tuvo el servicio activo desde que se dio de alta, no el mes completo. El motor reconoce automáticamente cuándo no hay comparación posible y ajusta la explicación — no fuerza una respuesta que no aplica.

---

## 5. Cómo funciona por dentro — el pilar de 0% alucinaciones (40 segundos)

> ¿Cómo garantizamos que la IA nunca invente un monto? Separamos completamente el cálculo de la redacción.
>
> Un motor determinista lee el CSV de facturación, compara el recibo actual contra los 5 anteriores, y calcula matemáticamente qué cambió. Eso nunca lo toca un modelo de lenguaje. Después, buscamos la explicación del concepto — o por mapeo directo si ya sabemos qué pasó, o por búsqueda semántica entre 12 documentos reales de capacitación de Movistar si es una pregunta más abierta. Recién ahí entra Gemini, y su único trabajo es redactar con esos datos ya calculados — nunca calcula, nunca decide un número.

**[ACCIÓN: mostrar el diagrama simplificado de FLUJO-BOT-MERMAID.md, si está en la PPT]**

---

## 6. Diferenciador — entiende el tono, no solo la pregunta (30 segundos) [RECORTABLE]

> Algo que no pedían las bases pero agregamos: un clasificador de sentimiento independiente. Si detecta que el cliente está genuinamente molesto — no solo confundido, sino enojado, amenazando con darse de baja — deriva a un asesor humano de inmediato, con todo el contexto, y bloquea cualquier oferta comercial. Un cliente enojado no necesita una promoción, necesita que alguien lo escuche.

---

## 7. Demo en vivo — Escenario 3: fin de descuento, bonus (25 segundos) [RECORTABLE — usar solo si sobra tiempo]

**[ACCIÓN: cambiar a la cuenta `720710029`]**

> Y como bonus, un tercer escenario: acá terminó un descuento temporal del 20% que el cliente tenía hace 3 meses. El recibo no subió por un cargo nuevo — bajó la ausencia del descuento. El bot lo distingue claramente: no es que te cobren más, es que dejaron de darte menos.

---

## 8. Cierre (20 segundos)

> No construimos un chatbot que contesta preguntas sobre facturación. Construimos un motor que nunca miente sobre un monto, y una capa de IA que solo tiene permiso de explicarlo — con evidencia, con el tono correcto, y derivando a una persona real apenas hace falta.
>
> Somos BotULima. Gracias.

---

## Preguntas esperables del jurado (preparar respuesta corta)

- **"¿Y si el CSV tiene un error?"** → El bot es tan confiable como la fuente; nunca corrige ni ajusta lo que lee, lo cual es la garantía de que tampoco inventa.
- **"¿Cómo escala esto a producción?"** → La arquitectura ya está lista para reemplazar los CSV por las APIs reales de BrainyBill/CRM Amdocs sin rediseñar el motor — hoy son datos sintéticos por privacidad, no una limitación técnica.
- **"¿Qué pasa si Gemini se cae en pleno uso?"** → Hay un fallback determinista automático — la conversación no se rompe, se degrada con elegancia.
- **"¿Por qué no un modelo predictivo de próximo recibo?"** → Evaluado y descartado a propósito: hubiera arriesgado el pilar de 0% alucinaciones al mezclar una estimación con hechos verificados. Se prioriza confiabilidad sobre una función vistosa.
