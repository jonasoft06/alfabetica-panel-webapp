import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Providers } from "./providers";
import "./globals.css";

const manrope = localFont({
  src: [
    { path: "../assets/fonts/manrope-latin-wght-normal.woff2", weight: "200 800", style: "normal" },
    { path: "../assets/fonts/manrope-latin-ext-wght-normal.woff2", weight: "200 800", style: "normal" },
  ],
  variable: "--font-manrope",
  display: "swap",
});

const fraunces = localFont({
  src: [
    { path: "../assets/fonts/fraunces-latin-opsz-normal.woff2", weight: "100 900", style: "normal" },
    { path: "../assets/fonts/fraunces-latin-ext-opsz-normal.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Alfabética Workspace", template: "%s · Alfabética Workspace" },
  description: "Panel administrativo de Alfabética.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#008f9f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${manrope.variable} ${fraunces.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
