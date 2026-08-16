# Base de conocimiento — Campaña de descuento de deuda (Churn)

**Fuente:** extraído y reestructurado de `Database/kb-facturacion-movistar-m3.md` v1.0 (Módulo II: Otros casos).
**Estado: sin causa propia en el diff engine.** Queda listo para la capa de búsqueda vectorial.

## Qué es (CH-01, CH-02)

Campaña que Movistar ofrece a **clientes seleccionados previamente** (no abierta a todos) para ayudarlos a pagar una deuda vencida con descuento, y así conservar el servicio. Requiere al menos un recibo pendiente de pago. Aplica a Móvil, Fija y Movistar Total — en Movistar Total se identifica sobre el producto Hogar (Fija).

## Cuánto es el descuento (CH-03) `[VERIFICAR VIGENCIA]`

| Modalidad | Descuento |
| --- | --- |
| Descuento porcentual | 25 %, 50 %, 75 % o 90 % de la deuda vencida |
| Pago fijo en Móvil | S/ 1.00 |
| Pago fijo en Fija | S/ 5.00 |

## Reglas clave

- **Duración (CH-04):** 7 días posteriores al vencimiento. Pasado ese plazo, el beneficio expira y se debe pagar el monto total.
- **Dónde se ve (CH-05):** en la app Mi Movistar, la web/app del banco, o billeteras digitales — el monto ya muestra el descuento aplicado.
- **Hay que pagar TODO (CH-06):** se debe pagar la totalidad de la deuda, todos los recibos pendientes, antes de la fecha límite. Pagar solo una parte no concreta el descuento ni reconecta el servicio.
- **Montos distintos por recibo, o menores a S/ 1 (CH-07):** no es un error. Cuando la deuda está repartida en más de un recibo, el descuento se distribuye entre ellos — el monto anunciado es el total, cada recibo muestra su fracción. Ejemplo: campaña de S/ 1.00 con 2 recibos → S/ 0.60 en uno y S/ 0.40 en el otro.
- **Pagó con descuento y no reconecta (CH-08):** verificar que se hayan pagado *todos* los recibos pendientes — si queda alguno, no procede la reconexión.
- **Pago no se refleja (CH-09):** puede tardar; si pasan más de 24 horas, es un caso de "pago no procesado" (ver `concepts/deuda-y-pagos.md`).
- **No se ve el descuento en el banco (CH-10):** puede ser intermitencia entre sistemas; el descuento sigue vigente dentro del plazo de la campaña.
- **Dos avisos de campaña (CH-11):** vale la campaña vigente, con su propia fecha límite.
- **No llegó ninguna campaña (CH-12):** se otorga solo a clientes preseleccionados; sin el beneficio asignado corresponde el pago regular, o consultar alternativas como el fraccionamiento (`concepts/fraccionamiento-deuda.md`).

## Casos resueltos

**Mónica — el monto en el banco no coincide con el informado:** el monto de la comunicación es referencial y corresponde al total; se distribuye entre los recibos. Debe pagar la totalidad antes de la fecha límite o pierde el descuento. *(No corresponde decir que el sistema simplemente tarda.)*

**Eduardo — pagó el total con descuento y no lo reconectan:** verificar si pagó todos sus recibos; si queda alguno pendiente, no procede la reconexión. *(No corresponde pedirle que espere sin más.)*

## Preguntas frecuentes

**P3-01 · ¿Por qué mi deuda aparece repartida en montos pequeños en distintos recibos?**
El descuento de la campaña se distribuye entre todos los recibos pendientes. El monto anunciado es el total; hay que pagarlos todos para que se aplique.

**P3-02 · ¿Puedo pagar solo una parte y mantener el descuento?**
No. La condición es pagar la totalidad antes de la fecha límite.

**P3-03 · Se venció la campaña, ¿se puede recuperar?**
No. Al vencer el plazo corresponde pagar el monto total; se puede consultar si hay otra alternativa, como el fraccionamiento.
