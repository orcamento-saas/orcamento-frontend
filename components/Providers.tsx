"use client";

import { HelpDoubtWidget } from "@/components/HelpDoubtWidget";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HelpDoubtWidget />
    </>
  );
}
