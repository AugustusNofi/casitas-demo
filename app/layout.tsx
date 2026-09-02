import type { Metadata } from "next";
import { Baloo_2, Inter } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { BookingsProvider } from "@/app/providers";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SandboxBanner from "@/components/SandboxBanner";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Casitas — Alquileres vacacionales con encanto",
  description:
    "Casitas es una demo de reservas de alojamiento vacacional que muestra varios flujos de pago reales de Nuvei en entorno sandbox: reserva instantánea, depósito + saldo, fianza de seguridad, cancelación/reembolso y multi-divisa.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${baloo.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-sand-50 text-ink-900">
        <CurrencyProvider>
          <BookingsProvider>
            <SandboxBanner />
            <Nav />
            <main className="flex-1">{children}</main>
            <Footer />
          </BookingsProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
