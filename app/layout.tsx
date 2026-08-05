import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oncar Desk",
  description: "Reserva de mesa do escritório da Oncar.",
};

// Zoom liberado até 5x (acessibilidade). Nunca setar maximum-scale=1 ou
// user-scalable=no — quebra pra quem tem baixa visão. `viewport-fit=cover`
// pra iPhone com notch.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#0B0C10",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
