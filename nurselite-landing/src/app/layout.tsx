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
  title: "NurseLite - Enfermeras a Domicilio en Lima | CEP Verificadas",
  description: "Conectamos pacientes con enfermeras profesionales verificadas por el CEP. Atencion medica de calidad en la comodidad de tu hogar. Inyecciones, curaciones, control de signos vitales y mas.",
  authors: [{ name: "Histora Health" }],
  creator: "Histora Health",
  publisher: "Histora Health",
  openGraph: {
    title: "NurseLite - Enfermeras a Domicilio en Lima",
    description: "Conectamos pacientes con enfermeras profesionales verificadas por el CEP. Tu salud en las mejores manos.",
    url: "https://nurse-lite.com",
    siteName: "NurseLite",
    locale: "es_PE",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NurseLite - Enfermeras a Domicilio en Lima",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NurseLite - Enfermeras a Domicilio en Lima",
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
};

// JSON-LD Schema for MedicalBusiness
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  name: "NurseLite",
  description: "Plataforma que conecta pacientes con enfermeras profesionales verificadas por el CEP para servicios de enfermeria a domicilio en Lima, Peru.",
  url: "https://nurse-lite.com",
  logo: "https://nurse-lite.com/nurselite.png",
  image: "https://nurse-lite.com/og-image.png",
  telephone: "+51999999999",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Lima",
    addressRegion: "Lima",
    addressCountry: "PE",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -12.0464,
    longitude: -77.0428,
  },
  areaServed: {
    "@type": "City",
    name: "Lima Metropolitana",
  },
  priceRange: "S/. 25 - S/. 250",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "200",
    bestRating: "5",
    worstRating: "1",
  },
  sameAs: [
    "https://www.facebook.com/nurselite",
    "https://www.instagram.com/nurselite",
  ],
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
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
        {/* Skip link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#1e3a5f] focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a9d9a]"
        >
          Saltar al contenido principal
        </a>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
