"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Download } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ui/ThemeToggle";

const navLinks = [
  { href: "#como-funciona", label: "Como Funciona" },
  { href: "#servicios", label: "Servicios" },
  { href: "#verificacion", label: "Verificacion CEP" },
  { href: "#testimonios", label: "Testimonios" },
  { href: "#faq", label: "FAQ" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[#64748b] hover:text-[#1e3a5f] dark:text-[#94a3b8] dark:hover:text-white font-medium transition-colors text-sm"
                >
                  {link.label}
                </Link>
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
            <nav className="flex flex-col gap-6">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-xl font-medium text-[#1e3a5f] dark:text-white hover:text-[#4a9d9a] transition-colors"
                  >
                    {link.label}
                  </Link>
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
