# Prompt estructurado — Módulo de Análisis de Sentimiento (ClarIA)

## 1. Dónde vive este módulo en la arquitectura

Es un **clasificador independiente**, separado del motor de redacción (Gemini 2.5 Flash que explica el recibo). No debe compartir el mismo prompt ni la misma llamada:

- El motor de redacción sigue sin ver cifras y solo redacta sobre hechos ya validados.
- El módulo de sentimiento solo ve el **texto del mensaje del cliente** (nunca datos financieros), corre en paralelo al Rules Engine, y su salida se usa como **input de decisión**, no como texto que se muestra al cliente.

Esto mantiene la separación de responsabilidades: un modelo decide *qué pasó con el recibo* (Rules Engine, determinista), otro decide *cómo redactar* (Gemini, sin cifras), y este nuevo módulo decide *cómo está el cliente* (tono/temperatura) para alimentar el Gate de decisión (hand-off, cierre, cross-selling).

---

## 2. Prompt de sistema (listo para integrar)

```
Eres un clasificador de tono conversacional para ClarIA, el asistente de explicación
de facturación de Movistar. Tu única función es analizar el TEXTO del mensaje del
cliente y clasificar su temperatura emocional aparente. No calculas montos, no
explicas el recibo, no tomas decisiones de negocio — solo clasificas tono.

## Qué debes evaluar
Analiza exclusivamente señales lingüísticas explícitas en el mensaje:
- Elección de palabras (quejas, insultos, agradecimientos, urgencia)
- Puntuación y mayúsculas (signos de exclamación repetidos, texto en mayúsculas)
- Marcadores de frustración explícitos ("ya llamé 3 veces", "esto es un abuso")
- Marcadores de conformidad o satisfacción explícitos ("ah ok, gracias", "entendido")

## Qué NO debes hacer
- No infieras estados psicológicos, diagnósticos ni intenciones no expresadas en el texto.
- No uses el historial de facturación ni montos para inferir sentimiento — solo el texto.
- No inventes señales que no estén presentes en el mensaje.
- No genermidas ni "suavices" tu clasificación para quedar bien — sé preciso.
- Si el mensaje es ambiguo o neutro (una simple pregunta informativa), clasifica como
  "neutral" — no fuerces una polaridad.

## Escala de temperatura (elige exactamente una)
- "positiva": agradecimiento, conformidad, tono cordial, cierre satisfecho.
- "neutral": pregunta informativa sin carga emocional explícita, primer contacto.
- "negativa": frustración, molestia, incredulidad ("no entiendo por qué me cobran esto").
- "critica": enojo explícito, amenaza de baja/cancelación, lenguaje agresivo,
  mención de reclamo formal o denuncia.

## Formato de salida
Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown,
siguiendo exactamente este esquema:

{
  "temperatura": "positiva" | "neutral" | "negativa" | "critica",
  "confianza": 0.0-1.0,
  "senales_detectadas": ["lista breve de 1-3 señales textuales que motivaron la clasificación"],
  "requiere_atencion_prioritaria": true | false
}

"requiere_atencion_prioritaria" es true únicamente si temperatura es "critica",
o si es "negativa" con confianza >= 0.75.

## Mensaje del cliente a analizar
{{mensaje_usuario}}

## Contexto conversacional reciente (opcional, últimos 2-3 turnos, solo si aporta contexto de tono)
{{historial_reciente}}
```

---

## 3. Ejemplos few-shot (para incluir en el prompt o en tests del backend)

**Ejemplo 1 — Positiva**
Input: "ah ok ya entendí, gracias por la explicación"
Output:
```json
{"temperatura": "positiva", "confianza": 0.92, "senales_detectadas": ["ah ok", "gracias"], "requiere_atencion_prioritaria": false}
```

**Ejemplo 2 — Neutral**
Input: "¿por qué mi recibo cambió este mes?"
Output:
```json
{"temperatura": "neutral", "confianza": 0.88, "senales_detectadas": ["pregunta informativa directa"], "requiere_atencion_prioritaria": false}
```

**Ejemplo 3 — Negativa**
Input: "esto no puede ser, otra vez me cobran de más y nadie me explica nada"
Output:
```json
{"temperatura": "negativa", "confianza": 0.81, "senales_detectadas": ["otra vez", "nadie me explica nada"], "requiere_atencion_prioritaria": true}
```

**Ejemplo 4 — Crítica**
Input: "YA ES EL COLMO, voy a dar de baja mi línea y a poner una queja en Indecopi"
Output:
```json
{"temperatura": "critica", "confianza": 0.95, "senales_detectadas": ["mayúsculas sostenidas", "amenaza de baja", "mención de reclamo formal"], "requiere_atencion_prioritaria": true}
```

---

## 4. Integración con las reglas de negocio existentes

| Temperatura detectada | Acción en el Gate de decisión |
|---|---|
| **Crítica** | Hand-off inmediato a asesor humano, con el contexto + la clasificación de temperatura incluida en el traspaso. Se omite cualquier oferta comercial. |
| **Negativa** (confianza ≥ 0.75) | Prioriza resolución clara y directa; si tras la explicación el cliente sigue negativo, dispara hand-off. Cross-selling bloqueado. |
| **Neutral** | Flujo estándar: explicación + cierre. Cross-selling solo si la regla de negocio original ya lo habilita (consulta resuelta positivamente). |
| **Positiva** | Habilita el "Efecto Efervescente" (recordar beneficios ya incluidos) y, si la regla de negocio lo permite, cross-selling contextual. |

Importante: la temperatura **nunca anula** la regla ya definida en el documento del desafío — "cross-selling activado única y exclusivamente si la consulta fue resuelta positivamente". La temperatura es un filtro adicional, no un reemplazo: puede bloquear una oferta, pero nunca la fuerza si la regla de negocio no la habilitó primero.

---

## 5. Notas técnicas para backend

- **Modelo sugerido:** un modelo ligero y rápido (ej. Gemini 2.5 Flash con este prompt separado, o un clasificador más pequeño si buscan latencia mínima) — no reutilizar la misma sesión/contexto del motor de redacción, para mantener el aislamiento del pipeline anti-alucinaciones.
- **Latencia objetivo:** debe correr en paralelo al Rules Engine (no en serie), para no añadir tiempo perceptible a la respuesta.
- **Privacidad:** el input es solo el texto del mensaje — nunca debe incluirse el historial financiero ni datos personales en el prompt de este módulo.
- **Logging:** guardar únicamente `temperatura`, `confianza` y el ID de conversación — no el texto textual del mensaje, salvo que ya se registre en otro sistema con las mismas garantías de privacidad que el resto de ClarIA.
- **Fallback:** si el clasificador falla o no responde, tratar como `"neutral"` con `requiere_atencion_prioritaria: false` — nunca bloquear la respuesta principal del asistente por un fallo en este módulo secundario.
- **Métrica de éxito sugerida:** puede alimentar directamente el indicador de "tasa de silencio post-explicación" que menciona el documento del desafío, cruzando temperatura final del cliente con si cerró la sesión sin más consultas.
