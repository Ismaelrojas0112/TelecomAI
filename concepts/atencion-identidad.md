# Base de conocimiento — Quién puede pedir la explicación del recibo

**Fuente:** extraído de `Database/kb-facturacion-movistar-m5-addendum.md` v1.0 (adenda "Planta — Lectura del recibo del cliente Movistar"). El ~90% de esa fuente ya estaba cubierto por los documentos anteriores; este archivo recoge únicamente lo nuevo.
**Estado: sin causa propia en el diff engine.** Es contenido de comportamiento/política de atención, no una causa de variación de recibo. Relevante para cómo el bot debe manejar la verificación de identidad (conecta con la autenticación simulada del prototipo — ver `PRD.md` y `FRONTEND.md`).

## Instrucciones para el bot

**No detallar los requisitos exactos de verificación de identidad.** La combinación precisa de datos que habilita el acceso a una cuenta se retiró a propósito de esta base (es información sensible tipo guía de ingeniería social) — el bot debe hablar de la verificación en términos generales, nunca enumerar qué datos exactos la satisfacen.

## Quién puede pedir la explicación (VA-01, VA-03)

La explicación del recibo se brinda tanto al **titular** de la línea como al **usuario** del servicio — no hace falta ser el titular. En ambos casos se realiza una verificación de identidad antes de dar información, porque el recibo contiene datos de la cuenta y la verificación protege esos datos de accesos no autorizados.

## Cómo varía la verificación (VA-02, en términos generales)

- Si la consulta viene **desde el propio número de la línea**, normalmente no hace falta validar datos adicionales.
- Si viene **desde otro número**, se pide verificar identidad — tener a la mano el documento de identidad y, si quien pregunta no es el titular, los datos básicos del titular.

## Preguntas frecuentes

**P5-01 · No soy el titular, ¿pueden explicarme el recibo?**
Sí. La explicación se brinda tanto al titular como al usuario del servicio, previa verificación de identidad.
