"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Smartphone, MessageCircleMore, IdCard } from "lucide-react";

export default function Home() {
  const [customerId, setCustomerId] = useState("");
  const query = customerId.trim() ? `?customer_key=${encodeURIComponent(customerId.trim())}` : "";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#12c6b1] to-[#0b86f7] text-2xl font-extrabold text-white shadow-lg">
          B
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight">BotULima</h1>
        <p className="max-w-md text-sm text-[var(--muted)]">
          Asistente que explica por qué cambió tu recibo Movistar, con causas
          verificadas contra los datos reales — cero cifras inventadas.
        </p>
      </div>

      <div className="flex w-full max-w-md flex-col gap-2 rounded-2xl border border-[var(--line)] bg-white p-5 text-left shadow-sm">
        <label
          htmlFor="landing-customer-id"
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[#8a93a4]"
        >
          <IdCard size={14} /> Ingresa tu ID de cliente
        </label>
        <input
          id="landing-customer-id"
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
          placeholder="Ej. 104180441"
          inputMode="numeric"
          className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[#42b9ab]"
        />
        <p className="text-xs text-[var(--muted)]">
          Opcional — si lo dejas en blanco, entras a un caso de demostración.
        </p>
      </div>

      <div className="flex w-full max-w-md flex-col gap-4">
        <Link
          href={`/dashboard${query}`}
          className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf3ff] text-[#176ecb]">
            <Smartphone size={22} />
          </span>
          <span>
            <strong className="block text-sm">App Mi Movistar</strong>
            <small className="text-xs text-[var(--muted)]">
              Dashboard con recibo, tendencia y chat embebido
            </small>
          </span>
        </Link>

        <Link
          href={`/whatsapp${query}`}
          className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8fff4] text-[#087566]">
            <MessageCircleMore size={22} />
          </span>
          <span>
            <strong className="block text-sm">Demo WhatsApp</strong>
            <small className="text-xs text-[var(--muted)]">
              Verificación simulada + el mismo motor conversacional
            </small>
          </span>
        </Link>
      </div>

      <p className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <ShieldCheck size={14} /> Datos sintéticos — sin información real de clientes
      </p>
    </main>
  );
}
