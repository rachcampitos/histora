import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Segments } from "@/components/Segments";
import { HowItWorks } from "@/components/HowItWorks";
import { Services } from "@/components/Services";
import { Security } from "@/components/Security";
import { CEPVerification } from "@/components/CEPVerification";
import { Testimonials } from "@/components/Testimonials";
import { FAQ } from "@/components/FAQ";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { StickyCTA } from "@/components/StickyCTA";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main-content">
        <Hero />
        <Segments />
        <HowItWorks />
        <Services />
        <Security />
        <CEPVerification />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <StickyCTA />
      <WhatsAppWidget />
    </>
  );
}
