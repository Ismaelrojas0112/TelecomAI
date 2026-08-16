# Desafío 1: Atención inteligente y explicación de recibos

## Objetivo general y contexto actual

- **Meta principal:** lograr que el cliente entienda su recibo sin necesidad de llamar a nadie.
- **Situación actual:** la facturación masiva genera muchas dudas porque el cliente no comprende las variaciones en sus montos.
- **Volumen de operación:** se emiten más de 5 millones de recibos mensuales, de los cuales cerca del 40% presenta variaciones de monto de un mes a otro.
- **Comportamiento del cliente:** al no comprender el recibo, los clientes buscan atención humana. Esto genera más de 200 mil llamadas mensuales al 104.
- **Limitación de los canales actuales:** la aplicación Mi Movistar registra más de 1.5 millones de interacciones mensuales de recibo, pero solo muestra el documento actual y 5 anteriores, sin explicarlos.

## El problema a resolver

- **Fricción por conceptos complejos:** los clientes enfrentan dificultades para entender conceptos técnicos como prorrateos, reconexiones, notas de crédito y ajustes por suspensión.
- **Esfuerzo manual:** el cliente se ve obligado a realizar una comparación lenta y poco intuitiva de sus recibos mes a mes.
- **Carga e impacto operativo:** esta situación produce llamadas recurrentes, contactos repetidos, reclamos, incremento de costos y una disminución en el NPS.
- **Riesgo de pérdida de clientes (churn):** la percepción de cobros excesivos afecta la confianza, elevando la propensión a que los usuarios den de baja sus servicios.

## Lo que se espera de la solución

- **Creación de un asistente:** desarrollar un chatbot o asistente conversacional omnicanal que interactúe en lenguaje natural.
- **Capacidades clave del asistente:**
  - **Comprensión de preguntas naturales:** debe entender y responder a consultas como "¿Por qué me vino más caro?" o "¿Qué me cobran?".
  - **Comparación y explicación:** debe cotejar el recibo actual con los anteriores, detectar la causa exacta de la variación y explicarla de forma sencilla y oportuna.
  - **Siguiente acción guiada:** facilitar opciones inmediatas como realizar el pago, revisar el detalle, ofrecer una solución raíz o derivar a un asesor con todo el contexto precargado.
  - **Cross-selling útil:** ofrecer alternativas comerciales únicamente cuando sea oportuno y de manera no invasiva.
- **Entregable requerido:** un prototipo funcional o mockup del asistente que opere con datos simulados o anonimizados.

## Características tecnológicas y enfoque diseñado

- **Combinación tecnológica:** uso de IA conversacional que integre Procesamiento de Lenguaje Natural (NLP) con Recuperación Aumentada (RAG), apoyándose en las reglas del negocio.
- **Precisión absoluta:** se exige un 0% de alucinaciones, garantizando que las respuestas estén estrictamente ancladas a la base de facturación provista.
- **Enfoque en la claridad:** se debe priorizar la comprensión del cliente a través de explicaciones claras, empáticas y transparentes por encima de respuestas extensas.
- **Seguridad de la información:** implementar un enfoque de "Zero Trust" para el uso responsable de la IA, previniendo la fuga de datos y asegurando la privacidad.
- **Escalabilidad:** el diseño debe soportar alta concurrencia, con picos de hasta 3 veces la volumetría normal.

## Impacto e indicadores esperados

Las metas de referencia que el jurado evaluará incluyen cómo la solución ayuda a mover los siguientes indicadores:

- Reducción del 15% en las llamadas al call center y WhatsApp.
- Incremento del 10% en el NPS transaccional de facturación (NPS Transaccional / FARECO) y en el NPS digital de la App Mi Recibo.
- Disminución del 5% en los reclamos por motivos de facturación.
- Reducción de las rellamadas asociadas a la explicación de recibos.
- Disminución de la propensión a la baja del servicio por inconformidad con el monto a pagar.
- Incremento de la autogestión a través de los canales digitales de la empresa.

## Datos disponibles para trabajar

Para la construcción del prototipo se entrega un dataset seguro basado en la operación real, compuesto por:

- **Recibos sintéticos:** factura actual más 5 previas que contienen variaciones inyectadas artificialmente (cambios de plan, descuentos, prorrateos, corte/reconexión).
- **Catálogo de conceptos:** estructura de cargos y conceptos de facturación detallados con ejemplos explicativos.
- **Preguntas frecuentes:** un compilado de dudas comunes anonimizadas.
- **Protección de datos:** toda la base es sintética/ficticia bajo un esquema de anonimización para evitar mostrar información sensible sin la debida autenticación.
- **Formato y simulación:** los datos se entregan como archivos CSV/Excel (historiales masivos) e información en formato JSON que simula las respuestas de las APIs de BrainyBill y CRM Amdocs, incluyendo reglas de negocio simplificadas.

### Ubicación del dataset en el proyecto

Ruta: `Database/`

Archivos entregados:

- `BRAINY_DESCUENTOS_CUOTAS.csv`
- `BRAINY_PRORRATEO_ALTASV3.csv`
- `BRAINY_RECONEXIONESV3.csv`
- `CATALOGO-OFERTAS.csv`
- `Diccionario de datos.xlsx`
- `FACTURACION-CLIENTES.csv`
- `NOTAS_CREDITO.csv`
- `Ordenes.csv`
- `PLANTA CLIENTES.csv`
- `Experto en facturación_Curso1_M1.pptx`
- `Experto en facturación_Curso1_M2.pdf`
- `Experto en facturación_Curso2_M1.pptx`
- `Experto en facturación_Curso2_M2.pptx`
