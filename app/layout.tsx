import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAdsTag } from "@/components/GoogleAdsTag";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Orçamentos LM",
  description: "Orçamentos profissionais com PDF e assinatura digital",
  icons: {
    icon: "/plan/icone.png",
    shortcut: "/plan/icone.png",
    apple: "/plan/icone.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${inter.className} overflow-x-hidden font-sans antialiased`}>
        <GoogleAdsTag />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
