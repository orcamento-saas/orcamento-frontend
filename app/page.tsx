import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Orçamentos LM — PDF, assinatura e acompanhamento de propostas",
  description:
    "Crie orçamentos profissionais, gere PDF, colete assinatura digital e acompanhe status em um só lugar. Plano Free para começar; Pro a partir de R$ 19,90/mês.",
  openGraph: {
    title: "Orçamentos LM — Orçamentos profissionais",
    description:
      "Capture leads, envie propostas e feche mais rápido com PDF e assinatura integrados.",
  },
};

export default function HomePage() {
  return <LandingPage />;
}
