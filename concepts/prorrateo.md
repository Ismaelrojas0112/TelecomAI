# Base de conocimiento — Prorrateo y primer recibo (Alta nueva)

**Fuente:** extraído y reestructurado de `Database/kb-facturacion-movistar.md` v1.0 (Módulo 1) y `Database/kb-facturacion-movistar-m2.md` v1.0 (Módulo 2, sección "El proporcional").
**Uso en el bot:** contenido de mapeo directo para la causa `prorrateo` del diff engine (ver `lib/concept-retrieval.ts`) — se usa cuando el recibo actual del cliente es su primer recibo (alta nueva) y no hay recibo anterior con qué comparar.
**No cubre:** reconexión, cambio de plan, promociones ni precios de planes — eso vive en otros archivos de `concepts/`.

## Fórmula del proporcional (PR-02, Módulo 2)

```
Proporcional = (Cargo Fijo del plan × Días con servicio) ÷ Días del mes
```

Los días se cuentan **incluyendo el día del hecho y el día de cierre del ciclo** (PR-04) — ej. alta el 02/07 con cierre de ciclo el 05/07 = 4 días (2, 3, 4 y 5 de julio), no 3.

**⚠️ Conflicto sin resolver:** `Database/kb-facturacion-movistar-m6.md` cuenta un caso equivalente (12 al 15 de septiembre) como **3 días**, no 4 — una convención distinta a esta regla PR-04, para una situación similar. La propia fuente de ese documento lo señala como su hallazgo más importante y lo deja explícitamente sin resolver (ver detalle en `concepts/fin-descuento.md`). El bot nunca debe calcular un conteo de días por su cuenta — los montos siempre salen del diff engine — pero si alguna vez se construye una función que verifique o recalcule un proporcional, hay que resolver esta discrepancia primero.

**Importante (PR-01):** el proporcional no aparece únicamente en altas nuevas — también se usa la misma lógica cuando hubo una suspensión de servicio (con días *sin* servicio) o un cambio de plan a mitad de mes. En este bot, la causa `prorrateo` del diff engine está acotada a altas nuevas (dataset `BRAINY_PRORRATEO_ALTASV3.csv`); los otros dos casos se cubren por las causas `reconexion` y por `concepts/cambio-de-plan.md` respectivamente.

## Instrucciones para el bot

- Responde solo con lo que dice este documento. Los montos, recibos y fechas en los ejemplos son **ilustrativos** — nunca los presentes como el dato real del cliente; los datos reales del cliente vienen siempre del diff engine, no de aquí.
- Los bloques `[DERIVADO]` son casos calculados aplicando estas reglas, no aparecen literalmente en la fuente original — igual de confiables, pero no son cita textual.
- Los bloques `[VERIFICAR VIGENCIA]` son medidas comerciales que pueden cambiar — si el bot los menciona, debe advertir que están sujetos a vigencia.

## Glosario base

- **Alta nueva (G-04):** contratar un servicio por primera vez. El primer recibo se comporta distinto a los siguientes porque incluye el cobro proporcional de los primeros días.
- **Cliente de planta (G-05):** cliente con servicio ya activo. Sus recibos son regulares, un ciclo completo por mes, sin proporcionales.
- **Cargo fijo (G-06):** el monto fijo que se paga mensualmente por el plan.
- **Proporcional o prorrateo (G-07):** fracción del costo total que corresponde a un periodo específico de uso. Aparece típicamente en el primer recibo de una alta nueva, cuando el servicio se activó a mitad de un ciclo y solo se cobran los días efectivamente transcurridos.
- **Renta Vencida — RV (G-08):** se factura la renta **después** de haber disfrutado el plan. Regla de oro: *"consumo primero, me facturan después."*
- **Renta Adelantada — RA (G-09):** se factura la renta **antes** de disfrutar el plan. Regla de oro: *"se factura antes de consumir todo el ciclo."*

## Qué contiene el primer recibo, según el caso (T-01)

| Producto | Renta | Situación | Qué contiene el recibo |
| --- | --- | --- | --- |
| Móvil | RV | Alta nueva — 1.er recibo | Solo el **proporcional** desde el alta hasta el cierre del primer ciclo |
| Móvil | RV | 2.º recibo en adelante / activo | La renta mensual del ciclo ya consumido |
| Móvil | RA | Alta nueva — 1.er recibo | El **proporcional** del alta **más** la renta del mes que está por comenzar (por eso suele ser más alto) |
| Móvil | RA | 2.º recibo en adelante / activo | Solo la renta del mes por disfrutar / del ciclo completo, por adelantado |
| Fija | RV | Alta nueva — 1.er recibo | Solo el **proporcional** desde el alta hasta el cierre del primer ciclo |
| Fija | RV | Servicio activo | La renta mensual del ciclo ya consumido |
| Fija | RA | Alta nueva — 1.er recibo | **Solo la renta del mes por disfrutar — no se cobra el proporcional del alta** `[VERIFICAR VIGENCIA]` |
| Fija | RA | Servicio activo | La renta del ciclo completo, por adelantado |

**Excepción importante — Fija + Renta Adelantada (T-02) `[VERIFICAR VIGENCIA]`:** si el alta ocurre antes del cierre del primer ciclo, esos días **no se cobran** (se exonera el proporcional). El primer recibo incluye únicamente el mes que se empezará a disfrutar. Es una medida comercial sujeta a vigencia.

## Casos resueltos

### Móvil, Renta Vencida
- **Alta el 07/07, ciclo 9 (M-RV-01):** 1.er recibo = solo proporcional del 07/07 al 09/07 (cierre del ciclo). 2.º recibo = renta completa del 10/07 al 09/08.
- **Alta el 16/07, ciclo 17 (M-RV-03) `[DERIVADO]`:** 1.er recibo = proporcional de 2 días (16/07 al 17/07). 2.º recibo = renta completa del 18/07 al 17/08.

### Móvil, Renta Adelantada
- **Alta el 12/07, ciclo 15 (M-RA-01):** 1.er recibo = proporcional (12/07 al 15/07) **+** el mes adelantado completo (16/07 al 15/08) — de ahí que este primer recibo sea más alto que los siguientes. Recibo siguiente = solo el mes por disfrutar (16/08 al 15/09).
- **Alta el 26/07, ciclo 27 (M-RA-03) `[DERIVADO]`:** mismo patrón — proporcional (26/07 al 27/07) + mes adelantado (28/07 al 27/08).

### Fija, Renta Vencida
- **Alta trío el 02/07, ciclo 5 (F-RV-01):** 1.er recibo = solo proporcional (02/07 al 05/07). 2.º recibo = renta completa (06/07 al 05/08).

### Fija, Renta Adelantada
- **Alta el 28/07, ciclo 31 (F-RA-01) `[VERIFICAR VIGENCIA]`:** los días del 28/07 al 31/07 **no se cobran**. 1.er recibo = solo el mes que va a recibir (01/08 al 31/08).

## Preguntas frecuentes directamente relacionadas

**P-01 · ¿Por qué mi primer recibo es distinto a los siguientes?**
Porque incluye un cobro proporcional: al contratar a mitad de un ciclo, solo se cobran los días transcurridos desde el alta hasta el cierre de ese primer ciclo. Desde el segundo recibo se factura el mes completo con normalidad. En Móvil con Renta Adelantada, ese primer recibo además suma el mes por adelantado, por lo que resulta más alto. En Fija con Renta Adelantada ocurre lo contrario: el proporcional del alta no se cobra `[VERIFICAR VIGENCIA]`.

**P-04 · ¿Por qué me cobran un periodo que todavía no he usado?**
Porque el servicio es de Renta Adelantada: se factura antes de que se consuma el ciclo, igual que el alquiler de una vivienda, que se paga al inicio del mes.
