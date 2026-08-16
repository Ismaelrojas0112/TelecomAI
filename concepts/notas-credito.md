# Base de conocimiento — Nota de Crédito

**Fuente:** extraído de `Database/kb-facturacion-movistar-m2.md` v1.0 (Módulo 2: Proporcionales).
**Uso en el bot:** concepto de apoyo, referenciado desde `concepts/reconexion.md` (caso Renta Adelantada) y `concepts/cambio-de-plan.md`. No tiene una causa propia en el diff engine todavía — el proyecto cuenta con el dataset `Database/NOTAS_CREDITO.csv`, pero no está conectado a `lib/diff-engine.ts` (ver nota en `PLAN-IMPLEMENTACION.md`).

## NC-01 · ¿Qué es una Nota de Crédito?

Es un documento con validez tributaria que se usa para **ajustar o devolver** un importe ya facturado en el recibo. Aparece cuando el cliente pagó por adelantado días que finalmente no consumió — por ejemplo, por una suspensión del servicio (corte y reconexión con Renta Adelantada) o por un cambio de plan a mitad de ciclo.

## NC-02 · ¿Dónde se ve?

En la **página 3** del recibo. Muestra el monto descontado por los días no consumidos.

## NC-03 · ¿Por qué el siguiente recibo salió más bajo?

Porque los días que ya se facturaron y no se consumieron se toman como pagados y se aplican al recibo siguiente — ese ajuste reduce el cargo fijo del recibo siguiente.

## Ejemplo ilustrativo del material (NC-04)

Nota de Crédito sobre un recibo de Movistar Hogar: dos conceptos (Movistar Internet S/ 27.65 + Movistar TV Fibra Flex S/ 23.73), subtotal S/ 51.38, IGV 18% S/ 9.25, total de la Nota de Crédito S/ 60.63. Motivo: "Ajuste Renta Fraccionaria". Este ejemplo es solo ilustrativo del formato — nunca debe presentarse como el monto real de un cliente.
