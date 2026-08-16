# Base de conocimiento — Descuentos: inicio y fin de vigencia

**Fuente:** extraído y reestructurado de `Database/kb-facturacion-movistar-m2.md` v1.0 (Módulo 2: Proporcionales) y `Database/kb-facturacion-movistar-m6.md` v1.0 (material "Explicación de recibo — Descuento por alta nueva o portabilidad").
**Uso en el bot:** contenido de mapeo directo para la causa `fin_descuento` del diff engine (ver `lib/concept-retrieval.ts`) — se dispara cuando un cargo clasificado como descuento desaparece del recibo actual respecto al anterior.
**No cubre:** el catálogo de descuentos vigentes ni sus porcentajes reales — esos datos, para cada cliente, vienen siempre del diff engine y de `CATALOGO-OFERTAS.csv`, nunca de aquí.

## Sobre qué aplica el descuento (DA-01)

**Únicamente sobre el cargo fijo del plan.** No se aplica sobre servicios adicionales (SBA), paquetes contratados aparte, ni cuotas de financiamiento de equipos — esos conceptos se cobran completos aunque el cliente tenga un descuento activo. Por eso un recibo con descuento vigente puede seguir viéndose "alto" si el cliente tiene un equipo financiado o paquetes adicionales.

## Principio general (DS-01)

Un descuento se aplica sobre el cargo fijo del plan durante un número pactado de ciclos. **El momento en que empieza a verse en el recibo depende del tipo de renta:**

| Tipo de renta | Cuándo empieza a aplicarse | Cuándo se ve en el recibo |
| --- | --- | --- |
| Renta Vencida (RV), cliente de planta | Desde el inicio del ciclo en curso, aunque el ofrecimiento haya sido a mitad de ciclo | En el recibo siguiente, ya completo |
| Renta Adelantada (RA), cliente de planta | Desde el ciclo siguiente (el ciclo en curso ya se facturó por adelantado) | En el recibo del ciclo siguiente |
| Alta o portabilidad con RV | Desde el alta, aplicándose incluso al proporcional | Desde el primer recibo |
| Alta o portabilidad con RA | Desde el primer ciclo regular completo, no alcanza al proporcional del alta | Desde el primer recibo, sobre la parte del ciclo regular |

## Qué pasa cuando el descuento termina (lo más relevante para explicar un aumento)

Cuando el período pactado de un descuento se cumple, el descuento **deja de aplicarse** y el recibo vuelve al monto normal del plan. Esto **no es un cobro nuevo ni un error** — es la ausencia del descuento que ya no corresponde.

Un matiz importante: si el descuento termina **a mitad de un ciclo**, el último recibo con descuento lo trae de forma **proporcional** a los días en que estuvo vigente dentro de ese período — por eso ese último descuento suele verse más chico que los anteriores, y el salto real al monto completo se nota recién en el siguiente recibo.

## Diferencia clave entre RV y RA (DS-07)

Si un cliente de planta recibe un descuento a mitad de ciclo:

- Con **Renta Vencida**, el descuento cubre el ciclo en curso completo (retroactivo al inicio del ciclo), porque ese ciclo todavía no se había facturado.
- Con **Renta Adelantada**, el descuento empieza recién en el ciclo siguiente, porque el ciclo en curso ya fue cobrado por adelantado.

En ambos casos el cliente recibe los meses de descuento pactados — lo que cambia es únicamente en qué recibo se empiezan a ver.

## Caso específico: descuento por alta nueva o portabilidad — se cuenta en días, no en recibos (DA-02, DA-03)

Cuando el descuento viene de un alta nueva o portabilidad, cubre una cantidad determinada de **días** de servicio (ej. ~90 días para "50% por 3 meses" — la duración exacta depende de la promoción vigente `[VERIFICAR VIGENCIA]`). Como el primer recibo casi nunca coincide con un mes completo (el cliente contrató a mitad de ciclo), **los días del beneficio no se reparten en recibos exactos**. Según el tipo de renta, el desfase se acomoda al principio o al final:

| | Renta Vencida (RV) | Renta Adelantada (RA) |
| --- | --- | --- |
| ¿Los días prorrateados del inicio llevan descuento? | Sí | No |
| ¿Cuántos recibos toca el beneficio? | Cuatro: tres completos y uno parcial | Tres, limpios |
| ¿Cómo termina el beneficio? | El último recibo es **mixto**: parte con descuento y parte sin él | El tercer recibo cierra el beneficio completo |
| Primer recibo | Solo los días prorrateados, **con** descuento | Días prorrateados **sin** descuento **más** el primer mes completo **con** descuento |

**Por qué en RV hay un cuarto recibo mixto (DA-05):** el descuento se empieza a consumir desde el primer día de servicio, incluidos los días prorrateados del arranque. Esos días restan del total de días del beneficio, así que al llegar al cuarto recibo quedan menos de un ciclo completo de descuento disponible — una parte del ciclo va con beneficio y el resto a precio completo.

**Por qué en RA son tres recibos limpios (DA-06):** los días prorrateados del arranque se cobran **sin** descuento (no se "gastan" días de beneficio en ellos), así que el total de días de descuento queda íntegro para tres ciclos completos.

**Ninguna modalidad recibe más ni menos beneficio (DA-07):** son los mismos días de descuento, solo que ubicados en distinto lugar — en RV el descuento llega antes pero termina desordenado (recibo mixto); en RA llega un poco después pero termina limpio.

**La analogía de los queques (DA-12):** cuatro porciones — tres representan meses completos, una representa los días sueltos del ajuste de ciclo. En RV, la porción de los días sueltos sí lleva el beneficio, pero por eso a la última porción "le falta cobertura" al final. En RA, la porción de los días sueltos va sin beneficio, pero a cambio las tres porciones siguientes se disfrutan completas. La cobertura total es la misma; cambia en qué extremo queda la porción sin cubrir.

## ⚠️ Conflicto sin resolver entre fuentes: conteo de días

`concepts/prorrateo.md` (regla PR-04, de `-m2.md`) cuenta los días de un proporcional de forma **inclusiva** (ej. 02/07 al 05/07 = 4 días). Este documento (`-m6.md`) cuenta un caso equivalente (12 al 15 de septiembre) como **3 días** — una convención distinta para una situación similar. La propia fuente de `-m6.md` señala esto como su hallazgo más importante y lo deja explícitamente sin resolver. **El bot no debe hacer sus propios cálculos de conteo de días** — los montos siempre salen del diff engine, nunca de una fórmula aplicada en el momento; este conflicto solo importa si en algún momento se construye una función que verifique o recalcule un proporcional.

## Preguntas frecuentes directamente relacionadas

**P2-13 · ¿Por qué mi recibo subió de un mes a otro sin haber cambiado nada?**
Lo más probable es que se haya acabado el período de descuento que tenía activo. Desde ese recibo se cobra el monto completo del plan contratado más los cargos adicionales que correspondan.

**P2-12 · ¿Por qué el descuento del último mes fue menor que el de los meses anteriores?**
Porque el beneficio terminó a mitad de ciclo — el descuento se calcula de forma proporcional a los días en que estuvo vigente dentro de ese período.

**P2-11 · Me ofrecieron un descuento, ¿desde cuándo lo veo en mi recibo?**
Depende del tipo de renta. Con Renta Vencida, se aplica desde el inicio del ciclo en curso y se ve completo en el siguiente recibo. Con Renta Adelantada, empieza en el ciclo siguiente, porque el ciclo actual ya fue facturado por adelantado.

**P2-14 · Contraté con descuento por portabilidad, ¿el descuento aplica a los primeros días?**
Depende del producto y la renta. En Renta Vencida el descuento alcanza también al proporcional del alta. En Móvil con Renta Adelantada el descuento empieza en el primer ciclo regular completo y no se aplica al proporcional del alta.

**P6-01 · Me dieron 50% de descuento pero mi primer recibo no es la mitad de mi plan.**
Depende del tipo de renta. Con Renta Adelantada, los días sueltos del arranque se cobran sin descuento y además se factura por adelantado el primer mes con descuento, así que el recibo suma dos conceptos. Con Renta Vencida, el primer recibo solo cobra los días sueltos, ya con el descuento aplicado, por eso resulta un importe pequeño.

**P6-03 · Me dieron 3 meses de descuento, ¿por qué en el cuarto recibo todavía veo una parte con descuento?**
Porque el cliente tiene Renta Vencida y el beneficio se cuenta en días, no en recibos. Los días del arranque ya consumieron parte del beneficio, así que el resto se traslada al cuarto recibo: una parte va con descuento y la otra a precio completo.

**P6-04 · ¿Por qué dos clientes con el mismo descuento tienen distinta cantidad de recibos con beneficio?**
Porque tienen tipos de renta distintos. Con Renta Adelantada son tres recibos con el beneficio completo; con Renta Vencida se reparte en cuatro, siendo el último parcial. Los días de descuento son los mismos en ambos casos.

**P6-05 · ¿Desde cuándo empieza a correr el descuento?**
Desde la activación del servicio. Por eso, si se contrató a mitad de ciclo, el beneficio no coincide exactamente con los meses de facturación.
