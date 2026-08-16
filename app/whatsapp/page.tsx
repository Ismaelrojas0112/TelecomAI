import type { Metadata } from "next";
import { Suspense } from "react";
import { WhatsAppDemo } from "../components/WhatsAppDemo";

export const metadata: Metadata = { title: "WhatsApp demo | ClarIA", description: "Experiencia omnicanal demostrativa de ClarIA." };

export default function WhatsAppPage() {
  return (
    <Suspense>
      <WhatsAppDemo />
    </Suspense>
  );
}
