import type { Metadata } from "next";
import { Suspense } from "react";
import { BillingDashboard } from "../components/BillingDashboard";

export const metadata: Metadata = {
  title: "Mi recibo | BotULima",
  description: "Dashboard demostrativo de explicación verificable de facturación.",
};

export default function DashboardPage() {
  return (
    <Suspense>
      <BillingDashboard />
    </Suspense>
  );
}
