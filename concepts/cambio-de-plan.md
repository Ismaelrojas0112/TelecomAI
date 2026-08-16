# Base de conocimiento — Cambio de plan

**Fuente:** extraído de `Database/kb-facturacion-movistar-m2.md` v1.0 (Módulo 2: Proporcionales).
**Estado: sin causa propia en el diff engine.** A diferencia de reconexión/prorrateo/fin_descuento, "cambio de plan" **no está conectado** a `lib/diff-engine.ts` — se evaluó usar `Ordenes.csv` para detectarlo (ver `FUNCIONALIDADES.md` y `PRD.md`, tabla de riesgos) pero sus categorías son ambiguas y no hay un valor explícito "cambio de plan". Este archivo queda listo por si se decide construir esa detección más adelante, o para responder preguntas genéricas por la capa de búsqueda vectorial (todavía no conectada).
**Cobertura de la fuente:** solo documenta escenarios de servicio **Fija**. La fuente no trae ejemplos de cambio de plan en Móvil, ni el caso "downsell con Renta Adelantada" — si preguntan por esos casos, el bot debe indicar que no cuenta con esa información (no inventar por analogía).

## Principio general (CP-01)

Cuando se cambia de plan a mitad de ciclo, ese ciclo se **parte en dos tramos**: los días con el plan anterior y los días con el plan nuevo, cada uno cobrado de forma proporcional. Desde el ciclo siguiente se paga el plan nuevo completo.

En **Renta Adelantada** hay un paso extra: como el ciclo ya se había cobrado por adelantado con el plan anterior, se emite una **Nota de Crédito** (ver `concepts/notas-credito.md`) por los días que ya no corresponden a ese plan.

## Tabla resumen (CP-02)

| Escenario | Renta | Cómo queda el recibo del ciclo del cambio |
| --- | --- | --- |
| Downsell (bajas de plan) | RV | Proporcional del plan anterior + proporcional del plan nuevo |
| Upsell (subes de plan) | RV | Proporcional del plan anterior + proporcional del plan nuevo |
| Upsell (subes de plan) | RA | Proporcional del plan nuevo − Nota de Crédito del plan anterior, sobre el ciclo ya facturado |

No hay dato para "Downsell con Renta Adelantada" — la fuente lo deja como vacío declarado.

## Por qué en Renta Adelantada se ve un cargo y una devolución juntos

Al subir de plan con Renta Adelantada, el recibo del cambio muestra a la vez un cargo adicional (el proporcional del plan nuevo) y una devolución (Nota de Crédito por lo ya pagado del plan anterior). **No es un cobro duplicado ni un error** — es el ajuste entre lo que ya se pagó con el plan anterior y lo que se empezó a usar con el plan nuevo.

## Preguntas frecuentes directamente relacionadas

**P2-09 · Cambié de plan a mitad de mes, ¿cómo se me cobra?**
Ese ciclo se divide en dos tramos: los días con el plan anterior y los días con el plan nuevo, cada uno cobrado de forma proporcional. Desde el ciclo siguiente se paga el plan nuevo completo.

**P2-10 · Subí de plan y en mi recibo veo un cobro extra y una devolución, ¿es un error?**
No. Ocurre con Renta Adelantada: ya se había pagado ese ciclo con el plan anterior, así que se cobra el proporcional del plan nuevo y se devuelve, mediante Nota de Crédito, la parte equivalente ya pagada del plan anterior.
