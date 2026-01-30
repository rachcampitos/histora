import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nurse-lite.com"),
  title: "NurseLite - Enfermeria a Domicilio en Lima | Profesionales CEP Verificados",
  description: "Conectamos pacientes con enfermeras profesionales verificadas por el CEP. Atencion medica de calidad en la comodidad de tu hogar. Inyecciones, curaciones, control de signos vitales y mas.",
  keywords: [
    "enfermeria a domicilio",
    "enfermera a domicilio Lima",
    "atencion medica domiciliaria",
    "enfermeras CEP verificadas",
    "cuidado de adultos mayores",
    "inyecciones a domicilio",
    "curaciones a domicilio",
    "NurseLite",
    "Histora Health",
  ],
  authors: [{ name: "Histora Health" }],
  creator: "Histora Health",
  publisher: "Histora Health",
  openGraph: {
    title: "NurseLite - Enfermeria a Domicilio en Lima",
    description: "Conectamos pacientes con enfermeras profesionales verificadas por el CEP. Tu salud en las mejores manos.",
    url: "https://nurselite.pe",
    siteName: "NurseLite",
    locale: "es_PE",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NurseLite - Enfermeria a Domicilio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NurseLite - Enfermeria a Domicilio en Lima",
    description: "Conectamos pacientes con enfermeras profesionales verificadas por el CEP.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "verification_token",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#1e3a5f" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && systemPrefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
