import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PostHogProvider } from "@/components/providers/posthog-provider";
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
  title: {
    default: "Claude Ads - Generador de Anuncios con IA",
    template: "%s | Claude Ads",
  },
  description:
    "Genera copy publicitario profesional para Meta, TikTok, Google, YouTube, LinkedIn, Pinterest, X y Microsoft Ads con Claude AI. Streaming en tiempo real, A/B testing, analisis de competencia y mas.",
  keywords: [
    "generador de anuncios",
    "copy publicitario",
    "IA",
    "Claude AI",
    "Meta Ads",
    "Google Ads",
    "TikTok Ads",
    "copywriting",
    "publicidad digital",
  ],
  authors: [{ name: "Claude Ads" }],
  openGraph: {
    title: "Claude Ads - Generador de Anuncios con IA",
    description:
      "Genera copy publicitario profesional para 8 plataformas con Claude AI.",
    url: "https://claudeads.com",
    siteName: "Claude Ads",
    type: "website",
    locale: "es_LA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Claude Ads - Generador de Anuncios con IA",
    description:
      "Genera copy publicitario profesional para 8 plataformas con Claude AI.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
