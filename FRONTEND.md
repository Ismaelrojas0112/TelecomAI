# Frontend — cómo quedó implementado

> Esta era originalmente la spec para que un compañero construyera la UI desde cero. Terminamos adoptando el frontend ya construido de un compañero de equipo (`github.com/EdwardAR/HackatonAI_Desafio1`) sin modificar sus componentes, y adaptamos la salida de nuestros propios endpoints a lo que ese frontend ya esperaba — ver Bloque D en [PLAN-IMPLEMENTACION.md](./PLAN-IMPLEMENTACION.md). Este documento se reescribió para reflejar el contrato y los componentes **reales**, no el plan original.

Contexto: hay **un solo motor de chat** (`app/components/Chat.tsx`) que se muestra dentro de dos "pieles" distintas — no son dos chats separados. Toda la lógica de negocio (qué responde el bot, cuándo aparece cross-selling, cuándo hay hand-off) la resuelve el backend en `app/api/chat/route.ts` — el frontend solo consume esa respuesta y la pinta. Ver [FLUJO-INFORMACION.md](./FLUJO-INFORMACION.md) y [FLUJO-BOT-MERMAID.md](./FLUJO-BOT-MERMAID.md) para cómo se arma esa respuesta.

## Contrato de datos real con el backend

**`GET /api/customers`** — las 6 cuentas curadas de demo (`app/api/customers/route.ts`).
```ts
type Customer = {
  customer_key: string;   // FINANCIAL_ACCOUNT_KEY real
  display_name: string;
  demo_phone: string;
  scenario: string;
  cause_label: string;
  variation: string;
};
// respuesta: Customer[]
```

**`GET /api/analysis?customer_key=...`** — recibo + tendencia + causas de una cuenta, para la vista tipo App Mi Movistar (`app/api/analysis/route.ts`). Acepta cualquier `FINANCIAL_ACCOUNT_KEY` real, no solo las 6 curadas.
```ts
type Analysis = {
  cliente: string;
  numero_recibo: string;
  ciclo_actual: string;
  recibo_actual: string;
  recibo_anterior: string | null;
  variacion: string;
  variacion_porcentaje: string | null;
  reconciliado: boolean;
  tendencia: { ciclo: string; period_end: string; importe_total: string }[];
  causas: {
    id: string; tipo: string; impacto: string; explicacion: string;
    evidencia: { table: string; record_id: string; field: string; value: string }[];
  }[];
};
```

**`POST /api/chat`** — el endpoint principal (`app/api/chat/route.ts`).
```ts
type ChatRequest = {
  customer_key: string;
  message: string;
  conversation_id?: string;   // si no llega, se autogenera
  channel?: "web" | "whatsapp";
};

type ChatResponse = {
  conversation_id: string;
  text: string;
  answer: string;              // mismo contenido que text
  breakdown: {
    concept: string; amount: string; previous_amount: string; date: string;
    evidence: { table: string; field: string; value: string }[];
  }[];
  actions: ("pagar" | "ver_detalle" | "derivar_asesor" | "cross_sell")[];
  cross_sell_offer: { title: string; description: string; price: string; source_offer_code: string } | null;
  handoff: { reason: string; context: Record<string, string> } | null;
  closing_reminder: string | null;
  tone: "positiva" | "neutral" | "negativa" | "critica";  // del clasificador de sentimiento
  generated_by: string;        // "gemini" | "determinista" | "fallback-determinista"
};
```

Con esto alcanza para pintar cualquiera de las 3 pantallas — ninguna decisión de negocio se toma en el frontend.

---

## Pantalla 0 — Landing con selector de cuenta (`app/page.tsx`)

Pantalla de entrada, nueva respecto al plan original. Campo para ingresar el ID de cualquier cuenta real (opcional — si se deja vacío, entra a un caso de demo) + dos tarjetas de destino ("App Mi Movistar" / "Demo WhatsApp"). El ID viaja por query string (`?customer_key=...`) a `/dashboard` o `/whatsapp`, que lo usan como cuenta inicial sin pasar por el selector curado.

---

## Pantalla 1 — Vista "App Mi Movistar" (`app/dashboard/page.tsx` → `app/components/BillingDashboard.tsx`)

**Layout real (de arriba hacia abajo):**
1. **Selector de escenario curado** — tarjetas con las 6 cuentas de demo (`GET /api/customers`), más un input libre para ingresar cualquier otra cuenta real sin volver a la landing.
2. **Header:** nombre del cliente (o `Cliente {id}` si la cuenta no está en la lista curada) + ciclo de facturación actual.
3. **Hero card:** monto total grande, variación vs. el recibo anterior, badge de "análisis conciliado".
4. **Gráfico de tendencia:** recibo actual + 5 anteriores (Recharts), sobre `GET /api/analysis`.
5. **Grid de causas detectadas:** una tarjeta por causa, cada una abre un modal con la evidencia real (tabla/campo/valor de donde salió la cifra).
6. **Chat embebido** (`Chat.tsx`) al final de la página, con `autoStart`.

---

## Pantalla 2 — Motor de chat compartido (`app/components/Chat.tsx`)

Usado embebido en la Pantalla 1 y como pantalla completa en la Pantalla 3, sin duplicar lógica.

- **Burbujas de mensaje:** usuario a la derecha, bot a la izquierda.
- **Tarjeta de desglose** (`breakdown`): una por causa verificada, con un `<details>` desplegable de "ver fuente del cálculo" (la evidencia real).
- **Botones de acción** (`actions`): uno por cada valor devuelto — Pagar, Ver detalle, Derivar a un asesor.
- **Tarjeta de oferta** (`cross_sell_offer`): solo se pinta si el backend la manda.
- **Tarjeta de hand-off** (`handoff`): muestra el resumen real enviado al asesor (motivo + contexto con montos/causas/sentimiento).
- **Mensaje de cierre** (`closing_reminder`): último mensaje de la conversación, estilo visualmente distinto — el "Efecto Efervescente".
- **Memoria de contexto:** `conversation_id` viaja en cada request; el frontend solo reenvía el mismo id mientras dure la conversación (el estado real vive en `lib/session-store.ts` en el backend).
- **Input de texto libre** + los botones de acción de la última respuesta del bot.

---

## Pantalla 3 — Skin WhatsApp (`app/whatsapp/page.tsx` → `app/components/WhatsAppDemo.tsx`)

Mismo `Chat.tsx`, envuelto para verse como WhatsApp.

1. **Header estilo WhatsApp:** ícono de contacto, "ClarIA Movistar", "en línea".
2. **Paso previo (solo si se entra directo a `/whatsapp`, sin ID desde la landing):** selector de escenario curado + verificación simulada (teléfono demo + código "1234") — narrativa de Zero Trust. Si el ID ya llegó desde la landing, este paso se salta y entra directo al chat.
3. **El chat en sí:** mismo `Chat.tsx`, con `variant="whatsapp"` (burbujas verdes/blancas).

---

## Notas

- Las 3 pantallas comparten `Chat.tsx` sin duplicar lógica — cualquier cambio de negocio se hace una sola vez, en el backend.
- Todos los datos que se muestran (montos, nombres, ofertas) vienen del backend — nada se hardcodea en el frontend salvo el nombre genérico de fallback (`Cliente {id}`) cuando una cuenta no está en la lista curada.
- `app/globals.css` trae el diseño completo (paleta azul/blanco para la Pantalla 1, verde para la Pantalla 3) — es el CSS original del repo adoptado, no Tailwind.
