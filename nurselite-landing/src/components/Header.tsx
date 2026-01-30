"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Download, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ui/ThemeToggle";

const navLinks = [
  { href: "#hero", label: "Inicio", sectionId: "hero" },
  { href: "#tecnologia", label: "Caracteristicas", sectionId: "tecnologia" },
  { href: "#como-funciona", label: "Como Funciona", sectionId: "como-funciona" },
  { href: "#seguridad", label: "Seguridad", sectionId: "seguridad" },
  { href: "#testimonios", label: "Testimonios", sectionId: "testimonios" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for active section highlighting
  useEffect(() => {
    const sectionIds = navLinks.map((link) => link.sectionId);
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(sectionId);
            }
          });
        },
        {
          threshold: 0.3,
          rootMargin: "-100px 0px -50% 0px",
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);

    if (element) {
      const offsetTop = element.offsetTop - 80; // Account for fixed header
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }

    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-lg shadow-md"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/nurselite.png"
                alt="NurseLite logo"
                width={40}
                height={40}
                className="rounded-xl object-cover"
                priority
              />
              <span className="text-xl font-bold text-[#1e3a5f] dark:text-white">
                Nurse<span className="text-[#4a9d9a]">Lite</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className={`relative font-medium transition-colors text-sm ${
                    activeSection === link.sectionId
                      ? "text-[#1e3a5f] dark:text-white"
                      : "text-[#64748b] hover:text-[#1e3a5f] dark:text-[#94a3b8] dark:hover:text-white"
                  }`}
                >
                  {link.label}
                  {/* Active indicator */}
                  {activeSection === link.sectionId && (
                    <motion.span
                      layoutId="activeSection"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </a>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-4">
              <ThemeToggle />
              <Link
                href="https://care.historahealth.com/auth/login"
                className="text-[#1e3a5f] dark:text-white font-semibold hover:text-[#4a9d9a] transition-colors"
              >
                Iniciar Sesion
              </Link>
              <Link
                href="https://care.historahealth.com/auth/register"
                className="btn-primary flex items-center gap-2 !py-3 !px-6 text-sm"
              >
                <Download className="w-4 h-4" />
                Descargar App
              </Link>
            </div>

            {/* Mobile Theme Toggle & Menu Button */}
            <div className="lg:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-[#1e3a5f] dark:text-white"
                aria-label={isMobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
              >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-white dark:bg-[#0f172a] pt-24 px-6 lg:hidden"
          >
            {/* Mobile nav indicator */}
            <p className="text-xs text-[#94a3b8] dark:text-[#64748b] mb-4 flex items-center gap-1">
              <ChevronDown className="w-3 h-3" />
              Navegar en esta pagina
            </p>

            <nav className="flex flex-col gap-4">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <a
                    href={link.href}
                    onClick={(e) => scrollToSection(e, link.href)}
                    className={`flex items-center justify-between text-xl font-medium transition-colors py-2 ${
                      activeSection === link.sectionId
                        ? "text-[#4a9d9a]"
                        : "text-[#1e3a5f] dark:text-white hover:text-[#4a9d9a]"
                    }`}
                  >
                    <span>{link.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${
                      activeSection === link.sectionId ? "rotate-180 text-[#4a9d9a]" : "text-[#94a3b8]"
                    }`} />
                  </a>
                </motion.div>
              ))}

              <div className="pt-6 border-t border-[#e2e8f0] dark:border-[#334155] flex flex-col gap-4">
                <Link
                  href="https://care.historahealth.com/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center py-3 text-[#1e3a5f] dark:text-white font-semibold border-2 border-[#1e3a5f] dark:border-[#4a9d9a] rounded-xl hover:bg-[#1e3a5f] dark:hover:bg-[#4a9d9a] hover:text-white transition-colors"
                >
                  Iniciar Sesion
                </Link>
                <Link
                  href="https://care.historahealth.com/auth/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-primary text-center flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Descargar App
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
