import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Used as the base URL for resolving relative metadata URLs (openGraph images,
// canonical links, robots.txt). Falls back to localhost when unset so local
// dev doesn't break; production deploys should set NEXT_PUBLIC_APP_URL.
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NexScope — Encuentra nichos rentables de YouTube con IA",
    template: "%s · NexScope",
  },
  description:
    "Descubre nichos rentables de YouTube con análisis potenciado por IA. Encuentra oportunidades, analiza canales y crea estrategias de contenido.",
  keywords: [
    "YouTube",
    "nicho",
    "IA",
    "análisis",
    "contenido",
    "monetización",
    "keywords",
    "tendencias",
  ],
  authors: [{ name: "NexScope" }],
  creator: "NexScope",
  publisher: "NexScope",
  applicationName: "NexScope",
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: siteUrl,
    siteName: "NexScope",
    title: "NexScope — Encuentra nichos rentables de YouTube con IA",
    description:
      "Descubre nichos rentables de YouTube con análisis potenciado por IA. Encuentra oportunidades, analiza canales y crea estrategias de contenido.",
    images: [
      {
        url: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
        width: 512,
        height: 512,
        alt: "NexScope",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "NexScope — Encuentra nichos rentables de YouTube con IA",
    description:
      "Descubre nichos rentables de YouTube con análisis potenciado por IA.",
    images: ["https://z-cdn.chatglm.cn/z-ai/static/logo.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "standard",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
