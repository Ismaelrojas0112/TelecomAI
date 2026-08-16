# Base de conocimiento — Corte y reconexión del servicio

**Fuente:** extraído y reestructurado de `Database/kb-facturacion-movistar-m2.md` v1.0 (Módulo 2: Proporcionales) y `Database/kb-facturacion-movistar-m4.md` v1.0 (Módulo I: Escenarios de productos, sección "Escenarios mixtos").
**Uso en el bot:** contenido de mapeo directo para la causa `reconexion` del diff engine (ver `lib/concept-retrieval.ts`).
**No cubre:** el monto real vigente de la reconexión — ojo, **las dos fuentes no coinciden entre sí**: el Módulo 2 usa S/ 7.42 de referencia y el Módulo I usa S/ 6.00 para el mismo concepto, ambos como cifras de enseñanza. Ninguna es la tarifa vigente. El monto real de cada cliente siempre viene del diff engine, nunca de aquí.

## Instrucciones para el bot

- El monto exacto que se le cobró al cliente viene siempre del diff engine (dato real de su cuenta). Este documento solo aporta el *porqué* del concepto.
- Si el bot menciona el monto de referencia de S/ 7.42 de este documento, debe presentarlo como referencial y sujeto a vigencia — nunca como el monto real del cliente si no coincide con el que dio el diff engine.
- `[VERIFICAR VIGENCIA]` = medida o monto comercial que puede cambiar.

## Principio general (RX-01, RX-02)

Al reconectarse el servicio se genera un **cargo por reconexión** (Cargo RX) — S/ 7.42 en los ejemplos de referencia del material, sujeto a vigencia. Este cargo se refleja en el recibo **posterior** a la reconexión, no en el recibo donde ocurrió el corte.

**El periodo en que no hubo servicio por la suspensión nunca se factura.** Cómo se refleja ese ajuste depende del tipo de renta:

| Tipo de renta | Cómo se refleja el tiempo sin servicio |
| --- | --- |
| Renta Vencida (RV) | El recibo se **parte en proporcionales**: se cobra el tramo antes del corte y el tramo después de la reconexión, y se omiten los días suspendidos. |
| Renta Adelantada (RA) | El mes ya se había cobrado por adelantado, así que los días sin servicio se **devuelven mediante una Nota de Crédito** (ver `concepts/notas-credito.md`) en un recibo posterior. |

Aplica igual a Móvil y a Fija.

## Los cuatro escenarios posibles (RX-03)

1. Reconexión en el **mismo ciclo** del corte.
2. Reconexión el **mismo día** del corte.
3. Reconexión en el **siguiente ciclo**.
4. Corte en el ciclo en curso y reconexión en el siguiente ciclo (**solo aplica en Renta Adelantada**).

## Con Renta Vencida (RV)

- **Mismo ciclo (RX-RV-01):** el recibo posterior al corte trae dos proporcionales — el tramo antes del corte y el tramo después de la reconexión — más el cargo por reconexión. Los días suspendidos, en medio, no se cobran.
- **Mismo día (RX-RV-02):** al no haber días sin servicio, los dos proporcionales cubren el mes completo — en la práctica, se paga el ciclo íntegro **más** el cargo por reconexión.
- **Siguiente ciclo (RX-RV-03):** el corte parte el recibo en dos: uno con el proporcional hasta el corte (los días suspendidos ya no se facturan, ni siquiera en el siguiente), y uno posterior con el proporcional desde la reconexión **más** el cargo por reconexión.

## Con Renta Adelantada (RA)

Como el ciclo ya se facturó por adelantado, los días sin servicio se devuelven con una **Nota de Crédito** en vez de partir el recibo en proporcionales.

- **Mismo ciclo (RX-RA-01):** el recibo siguiente trae el ciclo regular + el cargo por reconexión, menos una Nota de Crédito por los días sin servicio.
- **Mismo día (RX-RA-02):** no se emite Nota de Crédito (no hubo días sin servicio) — el único efecto es el cargo por reconexión.
- **Siguiente ciclo (RX-RA-03):** el ajuste (Nota de Crédito) no aparece en el recibo del mes del corte, sino en el recibo siguiente a la reconexión, junto con el cargo por reconexión.
- **Corte en un ciclo, reconexión en el siguiente (RX-RA-04):** puede generar más de una Nota de Crédito (una por cada ciclo con días sin servicio) antes de que aparezca el cargo por reconexión en el recibo donde se reconecta.

## Cuando además hay un descuento de por medio (escenarios mixtos)

Si el cliente tenía o recibió un descuento cerca de la fecha del corte, **el momento en que se activó el descuento respecto del corte cambia cómo se ve en el recibo** (EM-01, EM-04):

- **Descuento activado DESPUÉS del corte/reconexión (EM-02):** el descuento solo alcanza el tramo posterior a la reconexión — en el recibo que trae los proporcionales del corte aparece **un solo descuento** (parcial, por los pocos días entre la reconexión y el cierre de ciclo).
- **Descuento ya activo ANTES del corte (EM-03):** el descuento alcanza los dos tramos — el recibo trae **dos descuentos**: uno por el tramo previo al corte y otro por el tramo posterior a la reconexión.
- En ningún caso se descuentan ni se cobran los días sin servicio (EM-04).

**¿Se pierde el descuento si cortan el servicio? (EM-05)** No. El descuento sigue corriendo por los meses pactados — durante los días sin servicio simplemente no hay renta sobre la cual aplicarlo, así que se refleja solo en los tramos que sí se facturaron.

**Nota de fiabilidad:** la fuente de esta sección (Módulo I) tiene inconsistencias documentadas en los montos exactos de estos ejemplos (días que no cuadran con los soles citados) — se preservó aquí solo la estructura (qué conceptos aparecen y en qué orden), sin citar los montos puntuales del material original.

## Preguntas frecuentes directamente relacionadas

**P2-05 · ¿Cuánto cuesta la reconexión?**
En el material de referencia, S/ 7.42. Es un monto referencial sujeto a vigencia; se refleja en el recibo posterior a la reconexión.

**P2-06 · Pagué la deuda y me reconectaron el mismo día, ¿me descuentan algo?**
No, porque no hubo días sin servicio — se paga el ciclo completo más el cargo por reconexión.

**P2-07 · ¿Por qué el ajuste por mi corte no aparece en el recibo de ese mes?**
Porque el recibo de ese ciclo ya estaba emitido cuando ocurrió el corte. El ajuste (Nota de Crédito o proporcional) se refleja en un recibo posterior.

**P4-13 · Me cortaron el servicio y tenía un descuento vigente, ¿lo pierdo?**
No. El descuento continúa por los meses pactados. Durante los días sin servicio no hay renta que descontar, así que el beneficio se aplica solo a los tramos que sí se facturaron.

**P2-04 · ¿Me cobran los días que estuve sin servicio por un corte?**
No. Si el servicio es de Renta Vencida, el recibo se divide en proporcionales y esos días se omiten. Si es de Renta Adelantada, como ya se había pagado el mes por adelantado, se devuelve mediante una Nota de Crédito.
