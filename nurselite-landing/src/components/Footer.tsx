"use client";

import { Heart, Mail, Phone, MapPin, Instagram, Facebook, Linkedin } from "lucide-react";
import Link from "next/link";

const footerLinks = {
  producto: [
    { label: "Como Funciona", href: "#como-funciona" },
    { label: "Servicios", href: "#servicios" },
    { label: "Verificacion CEP", href: "#verificacion" },
    { label: "Testimonios", href: "#testimonios" },
    { label: "FAQ", href: "#faq" },
  ],
  legal: [
    { label: "Terminos de Servicio", href: "/terminos" },
    { label: "Politica de Privacidad", href: "/privacidad" },
    { label: "Cookies", href: "/cookies" },
  ],
  enfermeras: [
    { label: "Unete como Enfermera", href: "https://care.historahealth.com/auth/register?type=nurse" },
    { label: "Beneficios", href: "#" },
    { label: "Requisitos", href: "#" },
    { label: "Proceso de Verificacion", href: "#verificacion" },
  ],
};

const socialLinks = [
  { icon: Instagram, href: "https://instagram.com/nurselite", label: "Instagram" },
  { icon: Facebook, href: "https://facebook.com/nurselite", label: "Facebook" },
  { icon: Linkedin, href: "https://linkedin.com/company/nurselite", label: "LinkedIn" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0f1f33] text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <img
                src="/nurselite.png"
                alt="NurseLite"
                className="w-10 h-10 rounded-xl object-cover"
              />
              <span className="text-xl font-bold">
                Nurse<span className="text-[#4a9d9a]">Lite</span>
              </span>
            </Link>
            <p className="text-[#94a3b8] mb-6 max-w-sm leading-relaxed">
              Conectamos familias con enfermeras profesionales verificadas por el CEP.
              Atencion de calidad en la comodidad de tu hogar.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 text-sm">
              <a
                href="mailto:contacto@nurse-lite.com"
                className="flex items-center gap-3 text-[#94a3b8] hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
                contacto@nurse-lite.com
              </a>
              <a
                href="tel:+51999999999"
                className="flex items-center gap-3 text-[#94a3b8] hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4" />
                +51 999 999 999
              </a>
              <div className="flex items-center gap-3 text-[#94a3b8]">
                <MapPin className="w-4 h-4" />
                Lima, Peru
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[#4a9d9a] transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Producto</h3>
            <ul className="space-y-3">
              {footerLinks.producto.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#94a3b8] hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Nurses Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Para Enfermeras</h3>
            <ul className="space-y-3">
              {footerLinks.enfermeras.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#94a3b8] hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#94a3b8] hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[#64748b] text-sm">
              © {currentYear} NurseLite. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2 text-[#64748b] text-sm">
              <span>Desarrollado con</span>
              <Heart className="w-4 h-4 text-red-500" fill="currentColor" />
              <span>por</span>
              <a
                href="https://historahealth.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4a9d9a] hover:text-[#6bb5b3] font-medium transition-colors"
              >
                Histora Health
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
