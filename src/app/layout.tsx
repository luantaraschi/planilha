import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: "Meu espaço",
  description: "Organização pessoal, rotina e finanças em um só lugar.",
};

export const viewport: Viewport = {
  themeColor: "#A73655",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" lang="pt-BR">
      <body className={nunitoSans.variable}>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
