import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BarraNavegacion } from "@/components/barra-navegacion";
import { NetworkGuard } from "@/components/network-guard";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Seguimiento productivo",
  description: "Seguimiento de piezas de placares y cocinas cortadas en Rover.",
  robots: { index: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NetworkGuard>
          <BarraNavegacion />
          {children}
        </NetworkGuard>
        <Toaster />
      </body>
    </html>
  );
}
