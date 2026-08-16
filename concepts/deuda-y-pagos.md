# Base de conocimiento — Origen de la deuda, medios de pago y errores de pago

**Fuente:** extraído y reestructurado de `Database/kb-facturacion-movistar-m3.md` v1.0 (material "Expertos en Facturación – Curso 2, Módulo II: Otros casos").
**Estado: sin causa propia en el diff engine.** Ninguna de las 3 causas activas (`reconexion`, `prorrateo`, `fin_descuento`) cubre deuda/pagos. Este archivo queda listo para la capa de búsqueda vectorial (todavía no conectada), para responder preguntas abiertas sobre deuda y pagos.
**No cubre:** sistemas, rutas o procesos internos de atención (a propósito, la fuente los retiró) — si una pregunta solo puede responderse con eso, indicar que un asesor debe revisarlo. Tampoco precios reales de planes, catálogo comercial, cobertura ni soporte técnico.

## Canales de contacto (CT-01, CT-02)

| Necesidad | Canal |
| --- | --- |
| Consultar tu deuda | App Mi Movistar; web o app de tu banco (con el código de pago); billeteras digitales como Yape o Plin (con el código de pago) |
| Conocer tu código de pago | Llega por SMS, correo o WhatsApp. También se consulta en la línea **104** o por el chatbot |
| Enviar comprobantes de pago | WhatsApp de Atención Movistar: **+51 999 955 555** o **www.movistar.com.pe/Whatsapp** |
| Solicitar fraccionamiento de deuda | App Mi Movistar (autogestión) |

Movistar envía comunicaciones por correo, SMS y notificaciones push. Ante un aviso de deuda o campaña, siempre validar el estado real en la app Mi Movistar o con un asesor.

## Origen de la deuda

**Qué genera una deuda (DE-01):** no pagar el servicio contratado, o una **totalización** (cambio de titularidad de cuentas) que puede dejar una **deuda huérfana**.

**Deuda huérfana (DE-02, DE-03):** deuda asociada a una cuenta anterior que por eso no aparece en el recibo actual, aunque sigue pendiente. Ocurre típicamente al migrar a **Movistar Total**: el cambio de titularidad de cuentas financieras (que no es una cesión del servicio) puede dejar una deuda huérfana de los servicios anteriores. No es un error del sistema — se paga con el código de pago de la cuenta financiera correspondiente.

**Impacto crediticio (DE-04):** la deuda se reporta a centrales de riesgo (Infocorp) y afecta el historial crediticio.

**Con qué código se paga la deuda (DE-05) `[VERIFICAR VIGENCIA]`:**

| Servicio | Código de pago |
| --- | --- |
| Móvil | Código de pago del recibo (coincide con el número móvil) |
| Hogar sin línea de voz | Código de pago del recibo |
| Hogar con línea de voz | Número de teléfono fijo |
| Movistar Total con línea fija de voz | Prioriza el número de la línea fija — es el código que permite ver también la deuda huérfana |
| Movistar Total sin línea fija | Código de pago del recibo o la cuenta financiera |

**Por qué el recibo llegó más caro tras cambiar de plan (DE-06):** puede ser una combinación de causas: proporcional del cambio de plan a mitad de ciclo, fin de un período de descuento, cuota de financiamiento de equipo, cuota de fraccionamiento de deuda, o una deuda anterior arrastrada. Hay que revisar el detalle de la página 2, donde cada concepto aparece desglosado.

## "Deuda pasada" en el recibo

Es una línea que ya aparecía en el resumen de la página 1 desde el Módulo 1 (`concepts/orientacion-recibo.md`). Es el saldo pendiente de recibos anteriores, arrastrado al recibo actual.

**Ejemplo ilustrativo (RC-01):** un cliente con S/ 29.80 impagos en su primer recibo ve, en el segundo, "Deuda pasada S/ 29.80" sumada a sus cargos del mes — el total sube aunque el consumo de ese mes sea menor.

## Medios de pago

**Dónde pagar (MP-01):** según el servicio contratado:
- Móvil, Dúo Voz, Mono Voz, Trío y Movistar Total: app Movistar, bancos, tiendas físicas, Yape, agentes autorizados (incluido Globokas/GKN), Western Union, Metro y Wong.
- Dúo Internet, Mono Internet y Mono TV: todos los anteriores **excepto** Banco Pichincha, BanBif, Banco de la Nación, Metro y Wong (MP-02).

**Pagar varios recibos a la vez (MP-03):**

| Canal | ¿Permite pago simultáneo? |
| --- | --- |
| Interbank | Sí |
| BCP | No — permite marcarlos, pero se paga uno por uno |
| BBVA | No — solo permite pagar uno a la vez; buscando por número solo muestra el recibo más antiguo |
| Canales Movistar | No — debe pagarse cada factura, del más antiguo al más reciente |

**Comisiones por canal (MP-04) `[VERIFICAR VIGENCIA]`:**

| Banco | Ventanilla | Agente |
| --- | --- | --- |
| BCP | S/ 7.50 | S/ 1.20 |
| BBVA | S/ 5.90 | S/ 1.70 |
| Interbank | No presta el servicio | S/ 1.90 |
| Scotiabank | S/ 5.90 | S/ 1.50 |
| Banco de la Nación | No presta el servicio | S/ 0.00 |
| BanBif | S/ 2.00 | No presta el servicio |

| Agente | Ventanilla | Agente |
| --- | --- | --- |
| KasNet | S/ 1.20 | S/ 0.00 |
| Fullcarga | S/ 1.00 | S/ 0.00 |
| Red Digital | S/ 1.00 | S/ 0.00 |
| Western Union | S/ 1.10 | S/ 0.00 |
| Wong | S/ 0.00 | S/ 0.00 |
| Metro | S/ 0.00 | S/ 0.00 |

**Cómo pagar sin comisión (MP-05) `[DERIVADO]`:** Wong y Metro (con la restricción de MP-02 para internet/TV), los agentes KasNet/Fullcarga/Red Digital/Western Union en modalidad agente, y la app Mi Movistar o Yape.

## Errores en los pagos

**Los cinco escenarios (PG-01):**

| Escenario | Qué ocurrió | Origen |
| --- | --- | --- |
| Pago no procesado | Se pagó y el sistema Movistar no registró el pago | Error del sistema |
| Pago doble | Se pagó dos veces la misma factura | Error del cliente |
| Pago errado | Se pagó el servicio de otra persona, o se hizo una recarga en vez de pagar | Error del cliente |
| Pago revertido | El banco anuló la transacción y la deuda reapareció | Error/decisión del banco |
| Doble facturación | Un cargo ya pagado reaparece en un recibo posterior | Error de facturación |

**Pago no procesado, qué hacer (PG-02, PG-03):** dentro de las primeras 24 horas es el plazo normal de visualización — esperar y volver a validar en la app. Pasadas las 24 horas, enviar el comprobante de pago al WhatsApp de Atención Movistar (+51 999 955 555 o www.movistar.com.pe/Whatsapp); el plazo de atención es de 72 horas.

**Datos que van a pedir (PG-04):** DNI del titular, código/número con el que se pagó, tipo de servicio, ciclo de pago, voucher o comprobante.

**Pago doble (PG-05):** el monto a favor se aplica automáticamente al siguiente recibo. Si se prefiere devolución, se gestiona para cobrar en un centro de pago en 48 horas.

**Pagó el recibo de otra persona (PG-06):** enviar el voucher escaneado o foto al WhatsApp de Atención para regularizar al número correcto.

**Hizo una recarga en vez de pagar (PG-07):** el monto queda como recarga adicional al plan, usable una vez agotados los beneficios incluidos. El recibo debe pagarse aparte.

**Banco revirtió el pago (PG-08):** ocurre solo en banca digital. Hay que acercarse a la entidad bancaria con el comprobante para conocer el motivo; el pago debe rehacerse.

**Cobro de algo ya pagado / doble facturación (PG-09):** comparar el detalle (página 2) del recibo actual contra el del mes anterior para identificar el concepto y período repetidos — suele originarse tras una reconexión del servicio. Se reporta el caso con ambos recibos para revisión.

## Preguntas frecuentes

**P3-11 · ¿Cuánto cobra el banco por pagar el recibo?**
Varía por canal: ventanillas entre S/ 2.00 y S/ 7.50, agentes entre S/ 0.00 y S/ 1.90. Wong y Metro no cobran comisión. Montos sujetos a vigencia.

**P3-12 · ¿A qué WhatsApp se envía el comprobante de pago?**
Al +51 999 955 555 o por www.movistar.com.pe/Whatsapp.

**P3-13 · ¿Cuánto demora la atención de un pago no procesado?**
72 horas desde que se envía el comprobante.

**P3-14 · ¿Dónde se consulta el código de pago?**
Por SMS, correo o WhatsApp, o llamando al 104 o por el chatbot.
