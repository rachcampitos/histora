"use client";

import { Heart, Mail, Phone, MapPin, Instagram, Facebook } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
  ],
  enfermeras: [
    { label: "Unete como Enfermera", href: "https://care.historahealth.com/auth/register?type=nurse" },
    { label: "Beneficios", href: "#segmentos" },
    { label: "Proceso de Verificacion", href: "#verificacion" },
  ],
};

const socialLinks = [
  { icon: Instagram, href: "https://instagram.com/nurseliteperu", label: "Instagram" },
  { icon: Facebook, href: "https://facebook.com/nurseliteperu", label: "Facebook" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0f1f33] text-white mt-16 md:mt-24" role="contentinfo">
      {/* Main Footer */}
      <div className="container mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <Image
                src="/nurselite.png"
                alt="NurseLite logo"
                width={40}
                height={40}
                className="rounded-xl object-cover"
              />
              <span className="text-xl font-bold">
                Nurse<span className="text-[#4a9d9a]">Lite</span>
              </span>
            </Link>
            <p className="text-[#94a3b8] mb-6 max-w-xs leading-relaxed text-sm">
              Conectamos familias con enfermeras profesionales verificadas por el CEP.
              Atencion de calidad en la comodidad de tu hogar.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 text-sm mb-6">
              <a
                href="mailto:contacto@nurse-lite.com"
                className="flex items-center gap-2 text-[#94a3b8] hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>contacto@nurse-lite.com</span>
              </a>
              <a
                href="https://wa.me/51987654321"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#94a3b8] hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+51 987 654 321</span>
              </a>
              <div className="flex items-center gap-2 text-[#94a3b8]">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Lima, Peru</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[#4a9d9a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#4a9d9a]"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              {/* Product Links */}
              <div>
                <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
                  Producto
                </h3>
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
                <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
                  Enfermeras
                </h3>
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
                <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
                  Legal
                </h3>
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
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <p className="text-[#64748b]">
              © {currentYear} NurseLite. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-1.5 text-[#64748b]">
              <span>Hecho con</span>
              <Heart className="w-4 h-4 text-red-500" fill="currentColor" aria-hidden="true" />
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
