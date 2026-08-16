# Base de conocimiento — Fraccionamiento de deuda

**Fuente:** extraído y reestructurado de `Database/kb-facturacion-movistar-m3.md` v1.0 (Módulo II: Otros casos).
**Estado: sin causa propia en el diff engine.** Si un cliente pregunta por qué su recibo incluye una "Cuota X de 6 Fraccionamiento de deuda", hoy el diff engine la reportaría como un cargo genérico (`type: "cargo"`) sin este contexto — este archivo queda listo para la capa de búsqueda vectorial.

## Qué es (FR-01, FR-02) `[VERIFICAR VIGENCIA]`

Permite pagar la deuda en **cuotas sin intereses**, en algunos casos con un descuento adicional sobre la deuda. Solo para clientes **Móviles**, con deuda vencida y en corte por deuda, y solo al **titular** de la línea. (La fuente no documenta fraccionamiento para Fija ni Movistar Total — ante esa pregunta, indicar que no se cuenta con esa información.)

## Reglas clave

- **Cuotas (FR-03):** hasta 6, sin intereses.
- **Cómo se solicita (FR-04):** autogestión en la app Mi Movistar, o con un asesor.
- **Cuándo se refleja (FR-05):** hasta 48 horas desde la solicitud.
- **Reconexión (FR-06):** inmediata al momento de pagar.
- **Qué se paga en el siguiente recibo (FR-07):** el plan contratado **más** la cuota de la deuda fraccionada, identificada como cargo adicional (ej. "Cuota 5 de 6 Fraccionamiento de deuda").
- **El descuento es solo sobre la deuda (FR-11):** nunca se aplica al plan contratado, que se sigue cobrando completo.
- **Cuántas cuotas faltan (FR-14):** el recibo lo indica ("Cuota 5 de 6"); también se ve en la app.

## Los tres tipos (FR-08)

1. **Sin descuento:** la deuda se divide en cuotas, sin rebaja.
2. **Con descuento:** se aplica un descuento sobre la deuda (25/50/75/90 %) y luego se fracciona.
3. **De una deuda que ya tenía descuento:** la deuda ya venía rebajada por un descuento anterior, y sobre ese saldo se aplica el fraccionamiento con un descuento adicional.

## Ejemplos numéricos

**Sin descuento (FR-09):** plan S/ 80, deuda S/ 240 → cuota = 240 ÷ 6 = S/ 40 → total del recibo = S/ 120 (plan + cuota).

**Con descuento del 50 % (FR-10):** plan S/ 80, deuda S/ 240, descuento del 50 % = S/ 120, cuota de fraccionamiento S/ 40, descuento aplicado a la cuota S/ −20 → total del recibo = S/ 100.

**Caso real de la app (FR-12):** deuda vencida S/ 68.20, fraccionamiento con 50 % de descuento → 6 cuotas de S/ 5.68, ahorro total S/ 34.10 (verificación: 68.20 ÷ 6 = S/ 11.37 por cuota; con 50 % de descuento, S/ 5.68).

**Cómo se ve en el recibo (FR-13):** dentro de "Cargos Adicionales Inafectos", como "Cuota X de 6 Fraccionamiento de deuda" con su código. Ejemplo: cargos mensuales S/ 40.24 + cargo adicional afecto S/ 1.39 + cuota inafecta S/ 12.05 (cuota 5 de 6) + redondeo S/ 0.02 → subtotal S/ 47.35, IGV S/ 6.35, total facturado S/ 53.70.

## Preguntas frecuentes

**P3-04 · ¿El fraccionamiento tiene intereses?**
No, las cuotas son sin intereses, hasta 6.

**P3-05 · ¿El descuento del fraccionamiento reduce el plan mensual?**
No, se aplica solo sobre la deuda, nunca sobre el plan contratado.

**P3-06 · Solicité el fraccionamiento y no veo el cambio.**
El plazo de visualización es hasta 48 horas; si ya transcurrió, hay que contactar a Movistar.

**P3-07 · ¿Cuándo reconectan si acepto el fraccionamiento?**
Al momento de pagar, la reconexión es inmediata.
