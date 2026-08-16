# Flujo del bot — diagrama as-built

Diagrama completo de cómo procesa el bot un mensaje, tal como quedó implementado en `app/api/chat/route.ts` (no el plan original — ver [FLUJO-INFORMACION.md](./FLUJO-INFORMACION.md) para esa versión). Dos diferencias grandes respecto al plan: existe un **Gate de sentimiento** que puede saltar por encima de cualquier otra regla, y la **capa vectorial** ya está activa (no es un fallback pendiente).

## Diagrama completo

```mermaid
flowchart TD
    A[Cliente entra: landing con ID, selector curado, o WhatsApp] --> B[Se resuelve FINANCIAL_ACCOUNT_KEY]
    B --> C[Cliente escribe un mensaje]
    C --> D[POST /api/chat]

    D --> E["classifySentiment(mensaje)
    gemini-flash-lite-latest, independiente
    solo ve texto, nunca datos financieros"]
    D --> F["compareInvoices(cuenta)
    Diff engine: recibo actual vs 5 anteriores"]

    F --> G{Hay recibo para esta cuenta?}
    G -->|No| H["Hand-off inmediato
    reason: cuenta_sin_recibos"]

    G -->|Si| I["classifyFollowUp(mensaje)
    intent por palabras clave: satisfecho / confundido / quiere_asesor / otro"]
    I --> J[await sentiment]
    E -.-> J

    J --> K{temperatura es critica?}
    K -->|Si| L["Hand-off inmediato
    reason: cliente_critico
    sin oferta comercial
    incluye temperatura+confianza+señales"]

    K -->|No| M{"Ya se explico algo antes Y
    el cliente esta conforme?"}
    M -->|Si| N["Turno de cierre
    cross-sell si la regla de negocio lo permite
    Y el sentimiento no es negativo persistente
    + Efecto Efervescente si aplica"]

    M -->|No| O{"Ya se explico algo antes Y
    (pide asesor O sigue confundido O
    es negativo persistente con alta confianza)?"}
    O -->|Si| P["Hand-off
    reason segun el disparador
    cross-sell bloqueado"]

    O -->|No| Q[Flujo normal de explicacion]
    Q --> R["searchConcepts(mensaje)
    embedding de la pregunta + similitud coseno
    contra data/embeddings.json - 12 conceptos"]
    Q --> S["Causas del diff engine
    reconexion / prorrateo / fin_descuento / cargo generico"]

    R --> T["buildContext:
    montos y evidencia real + concepto ligado a la causa
    + conceptos generales si la pregunta calzo con alguno"]
    S --> T
    T --> U{Hay causa O hay concepto relevante?}
    U -->|Si| V["Gemini redacta la explicacion final
    solo redacta, nunca calcula ni inventa un monto"]
    U -->|No| W["Mensaje determinista de ultimo recurso
    ni el diff engine ni la busqueda vectorial encontraron algo"]

    V --> X["Next Best Action:
    pagar / ver_detalle / derivar_asesor"]
    W --> X
    X --> Y[Respuesta al cliente]

    style E fill:#fce4ec,stroke:#ad1457,color:#000
    style F fill:#e8f5e9,stroke:#2e7d32,color:#000
    style S fill:#e8f5e9,stroke:#2e7d32,color:#000
    style R fill:#e3f2fd,stroke:#1565c0,color:#000
    style T fill:#e3f2fd,stroke:#1565c0,color:#000
    style V fill:#fff3e0,stroke:#e65100,color:#000
    style L fill:#ffebee,stroke:#c62828,color:#000
    style P fill:#ffebee,stroke:#c62828,color:#000
    style H fill:#ffebee,stroke:#c62828,color:#000
```

**Colores:** rosa = clasificador de sentimiento (independiente, corre en paralelo). Verde = capa determinista (diff engine, nunca "genera" un número, solo lee y compara). Azul = capa vectorial (elige qué explicación general mostrar, nunca decide montos). Naranja = donde entra el LLM a redactar. Rojo = las 3 salidas de hand-off.

## Por qué el Gate de sentimiento va primero

La regla de negocio original solo consideraba palabras clave ("no entiendo", "quiero un asesor"). El Gate de sentimiento se agregó **por encima** de esa lógica porque un cliente puede estar molesto sin usar ninguna de esas palabras — "otra vez me cobran de más y nadie me explica nada" no dispara ningún keyword, pero sí es negativo con alta confianza. Por eso el chequeo de `temperatura == critica` ocurre antes que cualquier otra rama, incluida la del turno de cierre.

## Por qué la búsqueda vectorial corre siempre, no solo cuando falla el diff engine

Un cliente puede preguntar algo genérico ("¿qué es Movistar Total?") en una cuenta que además tiene una causa de variación detectada. Si la búsqueda vectorial solo corriera cuando `hasCauses` es falso, esa pregunta real se quedaría sin responder — el bot le explicaría su reconexión en vez de responder lo que preguntó. Por eso `searchConcepts()` corre en paralelo a leer las causas, y ambas cosas se le pasan juntas a Gemini para que redacte lo que efectivamente corresponde a la pregunta.

## Las 3 capas de retrieval, resumidas

| | Determinista (verde) | Vectorial (azul) | Sentimiento (rosa) |
|---|---|---|---|
| **Qué decide** | Montos, fechas, causa exacta | Qué explicación general mostrar | Prioridad del Gate, no el contenido de la respuesta |
| **Puede alucinar un monto** | No — lectura directa de filas del CSV | No — nunca toca montos | No aplica, no genera texto de negocio |
| **Fuente** | `FACTURACION-CLIENTES.csv` + tablas de escenario | `concepts/*.md` (12 archivos) vía `data/embeddings.json` | Solo el texto del mensaje del cliente |
| **Módulo** | `lib/diff-engine.ts` | `lib/concept-retrieval.ts` | `lib/sentiment.ts` |
