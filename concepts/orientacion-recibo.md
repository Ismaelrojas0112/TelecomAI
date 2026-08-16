# Base de conocimiento — Orientación general del recibo

**Fuente:** extraído y reestructurado de `Database/kb-facturacion-movistar.md` v1.0 (Módulo 1) y `Database/kb-facturacion-movistar-m5-addendum.md` v1.0 (adenda "Planta — Lectura del recibo del cliente Movistar"). La adenda confirmó sin contradecir la tabla de ciclos (C-02) y el mapa de datos (F-05) ya extraídos aquí — es una verificación cruzada útil, no solo una fuente más.
**Uso en el bot:** contenido de respaldo para preguntas abiertas que no están atadas a una causa puntual del diff engine (ej. "¿dónde veo cuánto debo pagar?", "¿por qué mi ciclo no coincide con el mes?"). Pensado para la capa de búsqueda por similitud (embeddings), no para mapeo directo por `CHARGE_CODE`.
**No cubre:** reconexión, cambio de plan, promociones, precios de planes, cobertura, soporte técnico ni datos de cuentas individuales — si la pregunta cae en eso, el bot debe decir que no cuenta con esa información.
**Ámbito:** Perú (soles, S/; IGV 18 %). Aplica a servicio Móvil y Fija (Movistar Hogar) por igual, salvo donde se indique lo contrario.

## Glosario

- **Ciclo de facturación (G-01):** periodo durante el cual se disfruta el plan contratado; tiene fecha de inicio y fin. Se asigna según la fecha en que se contrató el servicio.
- **Fecha de emisión (G-02):** día en que se factura el recibo. Aparece en la página 1, bloque "Ciclo de facturación".
- **Fecha de vencimiento (G-03):** día límite de pago antes de un posible corte. En el recibo figura como "Último día de pago". El recibo se envía ~10 días antes.

## Tabla de ciclos (C-02)

El número de ciclo es el **día de cierre**. La facturación inicia al día siguiente del cierre y termina el mismo día del mes siguiente. Los únicos ciclos existentes son **5, 9, 15, 17, 23, 27 y 31**.

| Ciclo | Inicio de facturación | Fin de facturación | Fecha de vencimiento |
| --- | --- | --- | --- |
| 5 | día 6 | 5 del mes siguiente | 21 |
| 9 | día 10 | 9 del mes siguiente | 25 |
| 15 | día 16 | 15 del mes siguiente | 01 |
| 17 | día 18 | 17 del mes siguiente | 05 |
| 23 | día 24 | 23 del mes siguiente | 09 |
| 27 | día 28 | 27 del mes siguiente | 13 |
| 31 | día 1 | 30 o 31 del mes | 17 |

**Cómo saber el propio ciclo (C-03):** revisar la página 1 del recibo, bloque "Ciclo de facturación", guiándose de la fecha de emisión y esta tabla.

## Renta Vencida vs. Renta Adelantada

- **RV — Renta Vencida (R-02):** se disfruta el plan primero y se factura después. Secuencia: Inicio → Fin → Pago. *"Consumo y luego me facturan."* Analogía: como el agua o la luz.
- **RA — Renta Adelantada (R-03):** se factura antes de usar el plan. Secuencia: Inicio → Pago → Fin. *"Se factura antes de consumir todo el ciclo."* Analogía: como el alquiler de una vivienda.
- **Por producto (R-06):** en Móvil con RV, la sigla **"RV"** aparece en la página 2 junto al nombre del plan; en Móvil con RA no aparece ninguna sigla. En **Fija nunca aparece ninguna sigla**, sea RV o RA.

### Cómo identificar el tipo de renta sin la sigla (I-01, I-03)

1. Mirar el mes del recibo (página 1).
2. Mirar el periodo facturado, entre paréntesis junto al plan (página 2).
3. Comparar: si el periodo ya transcurrió o termina en el mes del recibo → **RV**. Si el periodo recién comienza o no ha terminado → **RA**.

En Fija esto **siempre** hay que calcularlo así, porque la sigla nunca aparece.

## Estructura del recibo (3 páginas)

| Página | Nombre | Qué contiene |
| --- | --- | --- |
| 1 | Resumen | Producto (Móvil/Hogar), mes del recibo, ciclo de facturación, número de recibo, código de pago, **total a pagar** |
| 2 | Detalle | Cargos desglosados (precio de venta, IGV, importe), **periodo facturado** entre paréntesis junto al plan, subtotal, IGV (18 %) y total facturado |
| 3 | Información adicional | Explicación de conceptos facturables, lugares de pago, qué es el recibo digital |

**Mapa rápido de dónde está cada dato (F-05):**

| Dato | Página | Dónde |
| --- | --- | --- |
| Total a pagar | 1 | Recuadro destacado / última fila del resumen |
| Fecha de vencimiento | 1 | "Último día de pago" |
| Ciclo de facturación | 1 | Bloque "Ciclo de facturación" |
| Periodo facturado | 2 | Entre paréntesis, junto al nombre del plan |
| Sigla RV (solo Móvil RV) | 2 | Antes del nombre del plan |
| Subtotal / IGV / total facturado | 2 | Pie de la tabla de detalle |
| Lugares de pago | 3 | Bloque "Lugares de pago" |

Conceptos que aparecen en el resumen de la página 1 (F-02): Cargos Mensuales, Descuentos y Bonificaciones, Redondeo, Devoluciones, Débitos, Deuda pasada, Total a pagar.

**Tres precisiones adicionales sobre el detalle (RB-01, RB-02, RB-03):**

- El detalle de servicios y cargos de la página 2 corresponde **solo al período en curso** — no incluye montos vencidos de recibos anteriores. Si hay saldo pendiente, aparece aparte, en la línea "Deuda pasada" del resumen (ver `concepts/deuda-y-pagos.md`). Por eso el total a pagar puede ser mayor que la suma de lo listado en el detalle.
- El total final agrupa **todos los servicios** de la cuenta, no uno solo — si hay más de un servicio facturado junto, el importe final los suma a todos.
- La fecha de emisión está en la **parte superior izquierda** del bloque de ciclo de facturación; el monto total y el último día de pago están en la **parte superior derecha**.

## Preguntas frecuentes generales

**P-02 · ¿Por qué el periodo de mi recibo no coincide con el mes calendario?**
Porque la facturación se rige por el ciclo asignado, no por el mes calendario. Si el ciclo es 9, el periodo va del día 10 de un mes al día 9 del siguiente. Solo el ciclo 31 coincide casi exactamente con el mes calendario.

**P-03 · ¿Por qué el recibo de este mes cobra un periodo del mes pasado?**
Porque el servicio es de Renta Vencida: primero se disfrutan los beneficios y después se factura.

**P-05 · ¿Cuándo llega el recibo?**
Aproximadamente 10 días antes de la fecha de vencimiento.

**P-06 · ¿Qué pasa si no se paga antes del vencimiento?**
La fecha de vencimiento es el día límite antes de un posible corte del servicio.

**P-07 · ¿Dónde se ve el total a pagar?**
Página 1, recuadro destacado y última fila del resumen.

**P-08 · ¿Dónde se ve el desglose de los cobros?**
Página 2, tabla de detalle: cada concepto con precio de venta, IGV e importe; al pie, subtotal, IGV (18 %) y total facturado.

**P-09 · ¿Dónde se puede pagar el recibo?**
Página 3, bloque "Lugares de pago" (bancos, agentes y otros canales).

**P-10 · ¿Cómo saber si el recibo es de Móvil o de Fija?**
En el encabezado de la página 1: "Movistar Móvil" o "Movistar Hogar".

**P-11 · ¿El recibo de Fija es distinto al de Móvil?**
No, misma estructura (resumen, detalle, información adicional). La única diferencia es que en Fija nunca aparece la sigla del tipo de renta.

**P-12 · ¿Qué significan los conceptos del resumen?**
Cargos Mensuales = costo fijo del plan. Descuentos y Bonificaciones = rebajas aplicadas. Redondeo = ajuste de céntimos. Devoluciones = montos devueltos. Débitos = cargos adicionales. Deuda pasada = saldo pendiente de recibos anteriores. Total a pagar = suma final.

**P-13 · ¿Qué IGV se aplica?**
18 %, calculado sobre el subtotal y mostrado como línea separada en la página 2.
