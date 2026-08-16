# Base de conocimiento — Movistar Total y totalización de servicios

**Fuente:** extraído y reestructurado de `Database/kb-facturacion-movistar-m4.md` v1.0 (material "Expertos en Facturación – Curso 2, Módulo I: Escenarios de productos").
**Estado: sin causa propia en el diff engine.** El diff engine opera sobre una sola `FINANCIAL_ACCOUNT_KEY` a la vez; una totalización involucra dos cuentas (la fija anterior y la unificada), lo que excede el diseño actual. Queda listo para la capa de búsqueda vectorial.

## Aviso importante de la fuente

**Este es el documento con más inconsistencias numéricas de la serie de KB.** La propia fuente indica: *"Prioriza la estructura sobre las cifras. Lo que este documento enseña de forma confiable es qué conceptos aparecen en cada recibo durante una transición."* Varios importes del material original tenían errores (aritmética que no cierra, cifras cruzadas entre escenarios, etiquetas de renta trocadas) — ya fueron corregidos o retirados en las secciones de abajo; donde no había forma de confirmarlos, se describe solo la estructura, sin montos. **No usar ningún monto de este archivo para calcular el caso real de un cliente** — eso sale siempre del diff engine.

## Qué es Movistar Total y quién puede tenerlo

**Definición (MT-01):** integra los productos de telefonía móvil y fija en un solo plan, una sola cuenta y un solo recibo.

**Requisitos (MT-02, MT-03):** internet fijo **y** una línea móvil postpago — ambos, sin excepción. Sin internet fijo no es posible, aunque el cliente tenga TV u otros servicios.

**Las cuatro formas de llegar a Movistar Total (MT-04):**

| Modalidad | Situación de partida | Qué se agrega |
| --- | --- | --- |
| Alta Pura MT | Cliente nuevo, sin servicios previos | Contrata el paquete completo directamente |
| Completa Móvil | Ya tiene fija (teléfono, internet, TV) | Agrega una línea móvil |
| Completa Fija | Ya tiene móvil | Agrega teléfono, internet y TV |
| Totalización | Ya tiene móvil y fija **por separado** | Se unifican en un solo plan |

## Conceptos de la transición

- **Cambio de titularidad de cuentas — CATI (CA-01):** al unificar fija y móvil que existían por separado, se hace un cambio de titularidad de las cuentas financieras para que ambos servicios facturen bajo una sola cuenta. **No es una cesión del servicio** — el servicio sigue siendo del cliente, cambia solo la cuenta desde la que se factura.
- **Cambio de plan — CAPL (CA-02):** el cambio del plan anterior al plan Movistar Total. En la línea móvil es **inmediato**; en el servicio fijo puede tardar **hasta 5 días** `[VERIFICAR VIGENCIA]` por requerir migración técnica. **Todo cambio de plan genera un proporcional** (parte el ciclo en dos tramos), aunque el precio no cambie (CA-03).
- **Deuda huérfana (CA-04):** la deuda que queda pendiente en la cuenta financiera anterior tras unificar. No aparece en el nuevo recibo unificado, pero sigue pendiente — no es un error ni una deuda duplicada.
- **Saldo a favor (CA-05):** a diferencia de la deuda huérfana, el saldo a favor **sí se traslada** a la factura unificada y se descuenta de lo que corresponde pagar.
- **Dos recibos durante la transición (CA-06):** es normal recibir la nueva factura unificada **y** una última factura del servicio fijo por separado que cierra el período anterior. **Ambas deben pagarse.** Desde el ciclo siguiente, un solo recibo.

## Las reglas de la totalización

**Qué cambia y qué se mantiene al unificar (TZ-01):**

| Elemento | Qué pasa |
| --- | --- |
| Tipo de renta | Se mantiene el que tenía cada servicio antes de unificar |
| Ciclo de facturación | Prevalece el ciclo de la línea **móvil** |
| Cuenta financiera | Prevalece la de la línea **móvil** |
| Cuotas de financiamiento (si las había en fija) | Se trasladan a la factura unificada |
| Saldo a favor | Se traslada a la factura unificada |
| Deuda pendiente | Permanece en la cuenta del servicio fijo — es la deuda huérfana |

**La regla que más se pregunta (TZ-02):** el tipo de renta **no se unifica** — cada servicio conserva el suyo. Es normal ver, en un mismo recibo, un período ya consumido (RV) junto a un período que aún no se consume (RA), uno por cada servicio.

**La regla maestra (TZ-05):**

| Tipo de renta del servicio | Qué genera al unificar |
| --- | --- |
| Renta Vencida (RV) | Proporcionales y, si queda saldo impago, deuda huérfana |
| Renta Adelantada (RA) | Nota de crédito (saldo a favor) — no genera proporcional de alta ni deuda huérfana |

La razón: en RV el período aún no se había cobrado, así que se facturan los tramos pendientes. En RA el período ya estaba pagado, así que se devuelve la parte que ya no se usará con el plan anterior mientras se cobra el proporcional del nuevo (TZ-06) — no es un cobro duplicado, es el ajuste entre lo pagado y lo efectivamente usado.

## Cómo queda la facturación según el camino a Movistar Total

Estructura de lo que trae **el recibo de la transición** (una sola vez, al momento del cambio) frente a los recibos antes/después — sin citar montos, ya que varios de los importes de ejemplo de la fuente no eran confiables:

| Camino | Recibo de transición contiene |
| --- | --- |
| Ya tenía móvil, agrega fija — RV | Proporcional móvil (plan anterior) + proporcional móvil (plan nuevo) + proporcional del alta del servicio fijo, que **adopta el tipo de renta de la línea móvil** |
| Ya tenía móvil, agrega fija — RA | Proporcional del nuevo plan móvil − nota de crédito del plan anterior no usado + ciclo completo por adelantado de ambos servicios. El **servicio fijo no lleva proporcional** en altas con renta adelantada |
| Ya tenía fija, agrega móvil — RV | Proporcional fijo (plan anterior) + proporcional fijo (plan nuevo) + proporcional del alta de la línea móvil. Aunque el precio del plan fijo no cambie, igual aparecen **dos proporcionales del fijo**, porque todo cambio de plan divide el ciclo |
| Ya tenía fija, agrega móvil — RA | Proporcional del nuevo plan móvil − nota de crédito del plan anterior + ciclo completo por adelantado de ambos servicios |
| Alta Pura (cliente nuevo) — RV | Primer recibo = solo los proporcionales de ambos servicios desde el alta. No hay plan anterior, no hay deuda huérfana: arranque limpio |
| Alta Pura (cliente nuevo) — RA | Primer recibo = proporcional de la línea móvil + ciclo completo por adelantado de ambos servicios. El servicio fijo no genera proporcional |

## Totalización de dos servicios que ya existían (el caso más complejo)

Involucra ciclos distintos que hay que alinear. Pasos (TZ-07): se solicita → cambio de plan móvil (inmediato) → migración del servicio fijo (días después) → cambio de titularidad de cuentas (días antes del cierre del ciclo móvil) → primera factura Movistar Total → desde el siguiente ciclo, facturación unificada estable.

**Qué trae la primera factura, según la combinación de rentas (TZ-08, TZ-09 resumido):** la regla maestra (RV deja proporcionales/deuda huérfana, RA genera nota de crédito/saldo a favor) se aplica **de forma independiente a cada servicio** — por eso una combinación mixta (ej. fija RA + móvil RV) puede producir a la vez una deuda huérfana en un lado y una devolución en el otro, y el cliente puede terminar con **dos recibos que pagar**: la primera factura Movistar Total y una última factura por separado del servicio que tenía más antigüedad.

## Preguntas frecuentes

**P4-02 · Al pasar a Movistar Total, ¿tendré un solo recibo?**
Sí es la finalidad, pero durante la transición puede llegar la nueva factura unificada y una última factura del servicio fijo por separado — ambas se pagan. Desde el siguiente ciclo, un solo recibo.

**P4-03 · ¿Qué ciclo de facturación tendré?**
El de la línea móvil — el servicio fijo adopta ese ciclo.

**P4-04/P4-05 · ¿Cambia mi tipo de renta al unificar? ¿Por qué veo dos períodos distintos?**
No cambia — cada servicio conserva el suyo. Por eso en un mismo recibo puede verse un período ya consumido (RV) junto a uno que aún no se consume (RA).

**P4-06 · Tengo una deuda que no aparece en mi nuevo recibo.**
Es deuda huérfana de la cuenta anterior — no es un error, sigue pendiente y se paga con el código de esa cuenta.

**P4-07 · ¿Qué pasa con mi saldo a favor / mis cuotas de financiamiento?**
Ambos se trasladan a la factura unificada.

**P4-10 · Mi plan fijo cuesta lo mismo, ¿por qué veo dos cobros parciales?**
Porque todo cambio de plan divide el ciclo en dos tramos, aunque el importe no varíe.

**P4-11 · Me devolvieron dinero y a la vez me cobraron, ¿es un error?**
No, si el servicio está en Renta Adelantada — es el ajuste entre lo ya pagado con el plan anterior y el proporcional del plan nuevo.

**P4-12 · ¿Por qué mi primer recibo de Movistar Total tiene tantas líneas?**
Porque concentra la transición completa; desde el siguiente ciclo se simplifica a dos líneas (plan móvil y plan fijo).
