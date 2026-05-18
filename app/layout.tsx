import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Orçamentos LM",
  description: "Orçamentos profissionais com PDF e assinatura digital",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${inter.className} overflow-x-hidden font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
