# Base de conocimiento — Bloqueo de equipos financiados

**Fuente:** extraído y reestructurado de `Database/kb-facturacion-movistar-m3.md` v1.0 (Módulo II: Otros casos).
**Estado: sin causa propia en el diff engine.** `FACTURACION-CLIENTES.csv` sí tiene una clasificación `Cargo Unico financiamiento` (vista en la auditoría de datos) que podría usarse para detectar la causa "cuota de equipo financiado" — uno de los 5 escenarios de las bases que todavía no se construyó (ver `FUNCIONALIDADES.md`). Este archivo cubre específicamente qué pasa cuando esa cuota **no se paga**, no la explicación de la cuota en sí.

## Qué es (BT-01, BT-02)

Restricción de uso sobre el dispositivo cuando hay deuda pendiente por el **financiamiento del equipo**. Aplica solo a equipos vendidos en tiendas Movistar, únicamente con sistema operativo **Android**, mediante un software de restricción instalado en el equipo.

## Por qué se bloquea (BT-03)

Por deuda pendiente del financiamiento, originada por falta de pago del servicio, o por haber hecho un **PortOut** (portabilidad a otro operador) dejando cuotas pendientes.

## Secuencia de avisos y bloqueo (BT-04, BT-05)

Movistar avisa de forma proactiva antes de restringir:

| Momento | Qué ocurre |
| --- | --- |
| Entre 3 días antes y el día del vencimiento | Notificación en la app sobre la cuota de financiamiento incluida en el recibo |
| 1 día después del vencimiento | Bloqueo parcial: el equipo se bloquea 4 veces por 4 minutos a lo largo del día |
| 2 días después del vencimiento | Bloqueo total |

## Cómo se resuelve (BT-06)

Pagar la deuda por la app Mi Movistar, la app/web del banco, Yape o un agente autorizado, usando el código de la **cuenta financiera**. El equipo se reactiva en un **máximo de 24 horas** desde el pago; en algunos equipos hace falta conectarse a Wi-Fi para completar el desbloqueo.

## Lo que el bloqueo NO afecta (BT-07, BT-08)

- **No cancela la línea.** El chip y el número pueden usarse en otro teléfono con normalidad.
- **No bloquea llamadas de emergencia** ni el ingreso del PIN de desbloqueo, que quedan disponibles en la pantalla de bloqueo.

## Caso especial: equipos Motorola — MotoSafe 2.0 (BT-09)

El software de restricción requiere que el equipo esté **conectado a internet** (datos móviles o Wi-Fi). Si no se conecta, el equipo se restringe y puede requerir un **reseteo de fábrica** para recuperarlo — importante advertirlo.

## Al terminar de pagar (BT-10)

El software de restricción se desactiva y puede desinstalarse — igual tras un PortOut una vez saldada la deuda.

## PortOut con financiamiento pendiente (BT-11, BT-12)

Al portarse a otro operador con financiamiento pendiente, se debe **cancelar el total restante en un solo pago**, sin posibilidad de fraccionarlo — aunque falten varios meses. Si no se paga, el equipo se bloquea; la notificación llega aproximadamente 9 días después de concretada la portabilidad.

## Preguntas frecuentes

**P3-08 · Me bloquearon el equipo, ¿pierdo mi número?**
No, el bloqueo afecta solo al equipo — la línea sigue activa y el chip puede usarse en otro teléfono.

**P3-09 · ¿Cuánto demora el desbloqueo tras pagar?**
Máximo 24 horas; en algunos equipos hace falta conectarse a Wi-Fi.

**P3-10 · ¿Puedo fraccionar la deuda del equipo si me voy a otro operador?**
No — al salir de Movistar se debe cancelar el total del financiamiento pendiente, sin fraccionamiento.
