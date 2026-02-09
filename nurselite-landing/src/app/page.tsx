"use client";

import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { AppFeatures } from "@/components/AppFeatures";
import { SearchSection } from "@/components/SearchSection";
import { Segments } from "@/components/Segments";
import { HowItWorks } from "@/components/HowItWorks";
import { Services } from "@/components/Services";
import { Security } from "@/components/Security";
import { CEPVerification } from "@/components/CEPVerification";
import { NursePlans } from "@/components/NursePlans";
import { Testimonials } from "@/components/Testimonials";
import { FAQ } from "@/components/FAQ";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { StickyCTA } from "@/components/StickyCTA";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { StatsProvider } from "@/lib/StatsContext";

export default function Home() {
  return (
    <StatsProvider>
      <ScrollProgress />
      <Header />
      <main id="main-content">
        <Hero />
        <AppFeatures />
        <SearchSection />
        <Segments />
        <HowItWorks />
        <Services />
        <Security />
        <CEPVerification />
        <NursePlans />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <StickyCTA />
      <WhatsAppWidget />
    </StatsProvider>
  );
}
