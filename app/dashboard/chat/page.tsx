import type { Metadata } from "next";
import { Suspense } from "react";
import { ConsultaRecibo } from "../../components/ConsultaRecibo";

export const metadata: Metadata = {
  title: "Consultar recibo | BotULima",
  description: "Conversa con ClarIA mientras ves tu recibo y sus gráficos en vivo.",
};

export default function ConsultaPage() {
  return (
    <Suspense>
      <ConsultaRecibo />
    </Suspense>
  );
}
