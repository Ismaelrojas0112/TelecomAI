"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, BadgeCheck, Home, LogOut, Menu, MessageCircleMore, ReceiptText, ShieldCheck, X } from "lucide-react";
import { Badge, Card } from "./ui";
import { Chat } from "./Chat";
import { clearDemoSession } from "../lib/demo-session";

type Customer = { customer_key: string; display_name: string; scenario: string };
type Evidence = { table: string; record_id: string; field: string; value: string };
type Cause = { id: string; tipo: string; impacto: string; explicacion: string; evidencia: Evidence[] };
type Analysis = {
  cliente: string; numero_recibo: string; ciclo_actual: string; recibo_actual: string; recibo_anterior: string | null;
  variacion: string; variacion_porcentaje: string | null; reconciliado: boolean;
  tendencia: { ciclo: string; period_end: string; importe_total: string }[]; causas: Cause[];
};

function money(value: number) { return `S/${Math.abs(value).toFixed(2)}`; }

export function ConsultaRecibo() {
  const searchParams = useSearchParams();
  const customerKey = searchParams.get("customer_key")?.trim() || "104180441";
  const [mobileNav, setMobileNav] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [analysis, setAnalysis] = useState<Analysis>();

  const customer = customers.find((item) => item.customer_key === customerKey);
  const displayName = customer?.display_name ?? `Cliente ${customerKey}`;

  useEffect(() => {
    fetch("/api/customers").then((response) => response.ok ? response.json() : []).then((data: Customer[]) => {
      if (Array.isArray(data)) setCustomers(data);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    fetch(`/api/analysis?customer_key=${encodeURIComponent(customerKey)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("API unavailable")))
      .then((data: Analysis) => setAnalysis(data))
      .catch(() => setAnalysis(undefined));
  }, [customerKey]);

  const current = Number(analysis?.recibo_actual ?? 0);
  const previous = Number(analysis?.recibo_anterior ?? 0);
  const variation = Number(analysis?.variacion ?? 0);
  const chart = analysis?.tendencia.map((item) => ({ cycle: item.ciclo.slice(5), total: Number(item.importe_total) })) ?? [];
  const backHref = `/dashboard?customer_key=${encodeURIComponent(customerKey)}`;

  const logout = () => { clearDemoSession(window.sessionStorage); window.location.assign("/"); };

  return <main className="app-shell">
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <div className="brand"><span className="brand-mark">C</span><span>ClarIA</span></div>
      <button className="nav-close" onClick={() => setMobileNav(false)} aria-label="Cerrar menú"><X /></button>
      <nav aria-label="Navegación principal">
        <Link className="nav-item" href={backHref}><Home size={19} /> Resumen</Link>
        <a className="nav-item active" href="#"><MessageCircleMore size={19} /> Conversación</a>
        <Link className="nav-item" href="/whatsapp"><MessageCircleMore size={19} /> Demo WhatsApp</Link>
      </nav>
      <div className="sidebar-trust"><ShieldCheck size={19} /><div><strong>Datos demo protegidos</strong><span>Sin PII en el navegador</span></div></div>
      <button className="profile" onClick={logout} aria-label="Cerrar sesión"><span className="avatar">{displayName.slice(0, 2).toUpperCase()}</span><span><strong>{displayName}</strong><small>Consultando su recibo</small></span><LogOut size={16} /></button>
    </aside>

    <section className="workspace">
      <header className="topbar">
        <button className="menu-button" onClick={() => setMobileNav(true)} aria-label="Abrir menú"><Menu /></button>
        <div className="consulta-topbar-row">
          <Link href={backHref} className="consulta-back"><ArrowLeft size={15} /> Volver al resumen</Link>
          <div><p className="eyebrow">CONSULTA EN VIVO</p><h1 style={{ fontSize: 18 }}>Recibo de {displayName}</h1></div>
        </div>
      </header>

      <div className="content">
        <div className="consulta-layout">
          <div className="consulta-chat-pane">
            <Chat key={customerKey} customerKey={customerKey} displayName={displayName} autoStart />
          </div>

          <div className="consulta-receipt-pane">
            <Card className="consulta-summary">
              <Badge tone="good"><BadgeCheck size={14} /> {analysis?.reconciliado ? "Análisis conciliado" : "Análisis pendiente"}</Badge>
              <p className="eyebrow" style={{ margin: "16px 0 4px" }}>TOTAL DEL RECIBO</p>
              <div className="amount">S/{current.toFixed(0)}<span>.{current.toFixed(2).split(".")[1]}</span></div>
              <div className="consulta-summary-row"><span>Recibo anterior</span><strong>{money(previous)}</strong></div>
              <div className="consulta-summary-row"><span>Variación</span><strong>{variation >= 0 ? "+" : "−"}{money(variation)}</strong></div>
              <div className="consulta-summary-row"><span>Ciclo actual</span><strong>{analysis?.ciclo_actual ?? "—"}</strong></div>
            </Card>

            <Card className="trend-card">
              <div className="section-heading"><div><p className="eyebrow">ACTUAL + 5 CICLOS</p><h2 style={{ fontSize: 15 }}>Tu facturación en el tiempo</h2></div></div>
              <div className="chart-wrap" style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#e8ecf2" strokeDasharray="4 4" />
                    <XAxis dataKey="cycle" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `S/${value}`} />
                    <Tooltip formatter={(value) => [money(Number(value)), "Total"]} />
                    <Area type="monotone" dataKey="total" stroke="#1877f2" strokeWidth={3} fill="#d9ebff" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {analysis && analysis.causas.length > 0 && <div className="consulta-causes">
              {analysis.causas.map((cause, index) => {
                const evidenceDate = cause.evidencia.find((item) => item.field.includes("fecha"))?.value ?? analysis.ciclo_actual;
                return <div className="cause-card" key={cause.id} style={{ cursor: "default" }}>
                  <span className={`cause-icon cause-${index}`}><ReceiptText size={18} /></span>
                  <small className="cause-date">REGISTRO · {evidenceDate}</small>
                  <strong>{cause.tipo.replaceAll("_", " ")}</strong>
                  <span className="cause-description">{cause.explicacion}</span>
                  <span className="cause-bottom"><b>{Number(cause.impacto) >= 0 ? "+" : "−"}{money(Number(cause.impacto))}</b></span>
                </div>;
              })}
            </div>}
          </div>
        </div>
      </div>
    </section>
  </main>;
}
