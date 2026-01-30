"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";
import { AnimatedSection } from "./ui/AnimatedSection";
import Link from "next/link";
import { faqs, faqSchema } from "@/data/faqs";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="bg-[#f8fafc] dark:bg-[#0f172a] relative overflow-hidden"
      aria-labelledby="faq-title"
    >
      {/* FAQ Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#1e3a5f]/5 dark:from-[#4a9d9a]/10 to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Left Column - Header */}
          <div className="lg:col-span-2">
            <AnimatedSection>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a5f]/10 dark:bg-[#4a9d9a]/20 text-[#1e3a5f] dark:text-[#4a9d9a] rounded-full text-sm font-semibold mb-6">
                <HelpCircle className="w-4 h-4" />
                Preguntas Frecuentes
              </span>
              <h2
                id="faq-title"
                className="text-3xl md:text-4xl font-bold text-[#1a1a2e] dark:text-white mb-6"
              >
                Todo lo que necesitas saber
              </h2>
              <p className="text-lg text-[#64748b] dark:text-[#94a3b8] mb-8">
                Resolvemos tus dudas sobre NurseLite, el proceso de verificacion
                y como funciona nuestro servicio.
              </p>

              <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-[#e2e8f0] dark:border-[#334155]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a] flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1a2e] dark:text-white">¿Tienes mas preguntas?</p>
                    <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">Estamos aqui para ayudarte</p>
                  </div>
                </div>
                <Link
                  href="https://wa.me/51987654321?text=Hola, tengo una consulta sobre NurseLite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-center py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-[#0f172a]"
                >
                  Escribenos por WhatsApp
                </Link>
              </div>
            </AnimatedSection>
          </div>

          {/* Right Column - FAQ Accordion */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <AnimatedSection key={index} delay={index * 0.05}>
                  <motion.div
                    initial={false}
                    className={`bg-white dark:bg-[#1e293b] rounded-2xl border transition-all ${
                      openIndex === index
                        ? "border-[#4a9d9a] shadow-md"
                        : "border-[#e2e8f0] dark:border-[#334155]"
                    }`}
                  >
                    <button
                      onClick={() => setOpenIndex(openIndex === index ? null : index)}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <span className="font-semibold text-[#1a1a2e] dark:text-white pr-4">
                        {faq.question}
                      </span>
                      <motion.div
                        animate={{ rotate: openIndex === index ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0"
                      >
                        <ChevronDown
                          className={`w-5 h-5 ${
                            openIndex === index ? "text-[#4a9d9a]" : "text-[#64748b]"
                          }`}
                        />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {openIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pt-0">
                            <p className="text-[#64748b] dark:text-[#94a3b8] leading-relaxed">{faq.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
