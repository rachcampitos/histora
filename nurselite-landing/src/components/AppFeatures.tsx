"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Search,
  ShieldCheck,
  MapPin,
  MessageCircle,
  Lock,
  Wallet,
  LayoutDashboard,
  Trophy,
  Smartphone,
} from "lucide-react";
import { AnimatedSection } from "./ui/AnimatedSection";
import { useTheme } from "./ThemeProvider";
import { useState, useEffect, useCallback } from "react";

/* ── Feature definitions ── */
const features = [
  {
    icon: Search,
    title: "Busca tu Enfermera",
    description:
      "Busca por distrito y encuentra enfermeras verificadas cerca de ti. Filtra por especialidad, disponibilidad y calificacion.",
    color: "#22c55e",
  },
  {
    icon: ShieldCheck,
    title: "Perfil Verificado CEP",
    description:
      "Cada enfermera validada con el Colegio de Enfermeros del Peru. 100% profesionales reales.",
    color: "#10b981",
  },
  {
    icon: MapPin,
    title: "Seguimiento en Vivo",
    description:
      "Mira en tiempo real cuando tu enfermera acepta, sale, llega e inicia el servicio.",
    color: "#3b82f6",
  },
  {
    icon: MessageCircle,
    title: "Chat en Tiempo Real",
    description:
      "Comunicate directamente con tu profesional antes, durante y despues del servicio.",
    color: "#8b5cf6",
  },
  {
    icon: Lock,
    title: "Codigo de Seguridad",
    description:
      "Verificacion de identidad con codigo de 6 digitos al momento de la llegada.",
    color: "#06b6d4",
  },
  {
    icon: Wallet,
    title: "Pagos Seguros",
    description:
      "Paga con tarjeta Visa/Mastercard o Yape directamente en la app. Procesado por Culqi con encriptacion SSL.",
    color: "#4a9d9a",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Profesional",
    description:
      "Las enfermeras gestionan disponibilidad, solicitudes y rendimiento desde su panel.",
    color: "#6366f1",
  },
  {
    icon: Trophy,
    title: "Sistema de Niveles",
    description:
      "Gamificacion profesional: Certificada, Destacada, Experimentada y Elite.",
    color: "#d97706",
  },
];

const screenLabels = [
  "Inicio",
  "Perfil Enfermera",
  "Estados del Servicio",
  "Chat",
  "Codigo de Seguridad",
  "Pagos",
  "Dashboard Enfermera",
  "Niveles",
];

const slideDurations = [4500, 4500, 7500, 4500, 5000, 4500, 5000, 5000];

/* ── Theme helper ── */
interface ScreenProps {
  isDark: boolean;
}

const t = (isDark: boolean, light: string, dark: string) =>
  isDark ? dark : light;

/* ── Reusable star SVG ── */
const StarIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-2 h-2 text-[#f59e0b]"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

/* ════════════════════════════════════════
   Screen 1: Patient Home
   ════════════════════════════════════════ */
function HomeScreen({ isDark }: ScreenProps) {
  return (
    <>
      <div className="bg-gradient-to-b from-[#1e3a5f] to-[#4a9d9a] px-4 pt-2 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/60 text-[8px]">Bienvenida</p>
            <p className="text-white font-bold text-[11px]">Hola, Maria</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center relative">
            <div className="w-3.5 h-3.5 rounded-full bg-white/60" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#f43f5e] border border-[#4a9d9a]" />
          </div>
        </div>
        <div className="bg-white/15 rounded-xl px-3 py-2 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-white/50" />
          <span className="text-white/50 text-[9px]">
            Buscar servicio de enfermeria...
          </span>
        </div>
      </div>
      <div
        className={`px-3 py-3 flex-1 ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}
      >
        <p
          className={`text-[9px] font-semibold mb-2 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
        >
          Servicios Populares
        </p>
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {[
            { label: "Inyecciones", color: "#4a9d9a", price: "S/50" },
            { label: "Curaciones", color: "#1e3a5f", price: "S/60" },
            { label: "Control vital", color: "#f59e0b", price: "S/45" },
            { label: "Terapia", color: "#22c55e", price: "S/80" },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-xl p-2 shadow-sm border ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div
                  className="w-5 h-5 rounded-lg flex items-center justify-center"
                  style={{ background: `${s.color}15` }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded"
                    style={{ background: s.color }}
                  />
                </div>
                <span className="text-[7px] font-semibold text-[#4a9d9a]">
                  {s.price}
                </span>
              </div>
              <p
                className={`text-[8px] font-medium ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
        <p
          className={`text-[9px] font-semibold mb-1.5 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
        >
          Enfermeras Cerca de Ti
        </p>
        <div
          className={`rounded-xl p-2.5 shadow-sm border flex items-center gap-2.5 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center flex-shrink-0 ring-2 ring-[#f59e0b]">
            <span className="text-white text-[9px] font-bold">MC</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p
                className={`text-[9px] font-semibold ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
              >
                Maria C.
              </p>
              <span className="text-[6px] px-1 py-0.5 rounded bg-[#f59e0b]/15 text-[#d97706] font-bold">
                ELITE
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} />
              ))}
              <span className="text-[7px] text-[#64748b] ml-0.5">
                4.9 (245)
              </span>
            </div>
            <p className="text-[7px] text-[#4a9d9a] font-medium">
              CEP 108887 Verificada
            </p>
          </div>
          <div
            className={`rounded-lg px-2 py-1 flex items-center justify-center ${t(isDark, "bg-[#1e3a5f]", "bg-[#4a9d9a]")}`}
          >
            <span className="text-white text-[7px] font-semibold leading-none">Ver</span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════
   Screen 2: Nurse Profile
   ════════════════════════════════════════ */
function NurseProfileScreen({ isDark }: ScreenProps) {
  return (
    <>
      <div className="bg-[#0f172a] px-4 pt-2 pb-3">
        <div className="flex items-center justify-between">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-[8px]">&larr;</span>
          </div>
          <span className="text-white text-[9px] font-semibold">Perfil</span>
          <div className="w-5 h-5" />
        </div>
      </div>
      <div
        className={`px-4 pt-3 flex-1 ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}
      >
        <div className="flex flex-col items-center mb-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center ring-3 ring-[#f59e0b] shadow-lg">
            <span className="text-white text-sm font-bold">MC</span>
          </div>
          <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-[#f59e0b]/15 text-[#d97706] font-bold mt-1">
            ELITE
          </span>
          <p
            className={`text-[10px] font-bold mt-1 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
          >
            Maria Claudia C.
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
            <span className="text-[7px] text-[#22c55e] font-medium">
              CEP 108887 - HABIL
            </span>
          </div>
          <div className="flex items-center gap-0.5 mt-1">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} />
            ))}
            <span className="text-[7px] text-[#64748b] ml-0.5">
              4.9 (245 resenas)
            </span>
          </div>
        </div>
        <div
          className={`flex justify-around rounded-xl p-2 shadow-sm border mb-2.5 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
        >
          {[
            { val: "52", lbl: "Servicios" },
            { val: "245", lbl: "Resenas" },
            { val: "2 anos", lbl: "Experiencia" },
          ].map((s) => (
            <div key={s.lbl} className="text-center">
              <p
                className={`text-[10px] font-bold ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
              >
                {s.val}
              </p>
              <p className="text-[6px] text-[#64748b]">{s.lbl}</p>
            </div>
          ))}
        </div>
        <p
          className={`text-[8px] font-semibold mb-1 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
        >
          Especialidades
        </p>
        <div className="flex flex-wrap gap-1 mb-2.5">
          {["Inyectables", "Curaciones", "Terapia", "Control Vital"].map(
            (s) => (
              <span
                key={s}
                className={`text-[7px] px-1.5 py-0.5 rounded-full font-medium ${t(isDark, "bg-[#4a9d9a]/10 text-[#3d8580]", "bg-[#4a9d9a]/20 text-[#6bb5b3]")}`}
              >
                {s}
              </span>
            )
          )}
        </div>
        <div
          className={`rounded-xl py-2 flex items-center justify-center ${t(isDark, "bg-[#1e3a5f]", "bg-[#4a9d9a]")}`}
        >
          <span className="text-white text-[9px] font-semibold leading-none">
            Solicitar Servicio
          </span>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════
   Screen 3: Service Tracking (animated)
   ════════════════════════════════════════ */
const serviceSteps = [
  {
    label: "Aceptado",
    sublabel: "Enfermera confirmada",
    gradient: "from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]",
    color: "#3b82f6",
    icon: "\u2713",
  },
  {
    label: "En camino",
    sublabel: "Llegando en 8 min",
    gradient: "from-[#f97316] via-[#ea580c] to-[#f97316]",
    color: "#f97316",
    icon: "\u2192",
  },
  {
    label: "Llego",
    sublabel: "En tu domicilio",
    gradient: "from-[#f59e0b] via-[#d97706] to-[#f59e0b]",
    color: "#f59e0b",
    icon: "\u25CF",
  },
  {
    label: "En servicio",
    sublabel: "Atencion en progreso",
    gradient: "from-[#10b981] via-[#059669] to-[#10b981]",
    color: "#10b981",
    icon: "\u2695",
  },
  {
    label: "Completado",
    sublabel: "Servicio finalizado",
    gradient: "from-[#34d399] via-[#10b981] to-[#34d399]",
    color: "#10b981",
    icon: "\u2713",
  },
];

function TrackingScreen({ isDark }: ScreenProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setActiveStep(0);
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev >= serviceSteps.length - 1 ? prev : prev + 1));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const step = serviceSteps[activeStep];

  return (
    <>
      <div className="bg-[#0f172a] px-4 pt-2 pb-2.5">
        <div className="flex items-center justify-between">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-[8px]">&larr;</span>
          </div>
          <span className="text-white text-[9px] font-semibold">
            Servicio Activo
          </span>
          <div className="w-5 h-5" />
        </div>
      </div>
      <div
        className={`px-3.5 py-3 flex-1 ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}
      >
        {/* Animated gradient banner */}
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className={`relative rounded-xl p-3 mb-3 overflow-hidden bg-gradient-to-r ${step.gradient}`}
          style={{
            backgroundSize: "200% 200%",
            animation: "gradient-shift 3s ease infinite",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)",
              animation: "pulse-glow 2s ease-in-out infinite",
            }}
          />
          <div className="relative flex items-center gap-2.5">
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm"
            >
              <span className="text-white text-sm font-bold">{step.icon}</span>
            </motion.div>
            <div className="flex-1">
              <p className="text-white text-[11px] font-bold">{step.label}</p>
              <p className="text-white/70 text-[7px]">{step.sublabel}</p>
            </div>
            <div className="text-white/40 text-[8px] font-mono">
              {activeStep + 1}/5
            </div>
          </div>
        </motion.div>

        {/* Vertical timeline */}
        <div className="pl-1 mb-2.5">
          {serviceSteps.map((s, i) => (
            <div key={s.label} className="flex items-start gap-2.5">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <motion.div
                    key={`pulse-${i}-${activeStep}`}
                    animate={
                      i === activeStep
                        ? { scale: [1, 2.5], opacity: [0.4, 0] }
                        : { scale: 1, opacity: 0 }
                    }
                    transition={
                      i === activeStep
                        ? { duration: 1.4, ease: "easeOut" }
                        : { duration: 0.4 }
                    }
                    className="absolute inset-0 rounded-full"
                    style={{ background: s.color }}
                  />
                  <div
                    className="relative w-4 h-4 rounded-full flex items-center justify-center transition-all duration-400"
                    style={{
                      background:
                        i <= activeStep
                          ? s.color
                          : isDark
                            ? "#334155"
                            : "#e2e8f0",
                    }}
                  >
                    {i < activeStep ? (
                      <span className="text-white text-[6px] font-bold">
                        {"\u2713"}
                      </span>
                    ) : i === activeStep ? (
                      <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-white"
                      />
                    ) : (
                      <span
                        className={`w-1 h-1 rounded-full ${isDark ? "bg-[#64748b]" : "bg-[#94a3b8]"}`}
                      />
                    )}
                  </div>
                </div>
                {i < serviceSteps.length - 1 && (
                  <div className="relative w-0.5 h-4">
                    <div
                      className={`absolute inset-0 ${isDark ? "bg-[#334155]" : "bg-[#e2e8f0]"}`}
                    />
                    {i < activeStep && (
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 origin-top"
                        style={{ background: s.color }}
                      />
                    )}
                  </div>
                )}
              </div>
              <div className="-mt-0.5 pb-1">
                <p
                  className={`text-[8px] font-semibold transition-colors duration-300 ${
                    i <= activeStep
                      ? t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")
                      : "text-[#94a3b8]"
                  }`}
                >
                  {s.label}
                </p>
                {i <= activeStep && (
                  <p className="text-[6px] text-[#64748b]">
                    {i < activeStep ? "Completado" : "Ahora"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Nurse card */}
        <div
          className={`rounded-xl p-2 flex items-center gap-2 border ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center ring-2 ring-[#f59e0b]">
            <span className="text-white text-[6px] font-bold">MC</span>
          </div>
          <div className="flex-1">
            <p
              className={`text-[8px] font-semibold ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
            >
              Maria C.
            </p>
            <p className="text-[6px] text-[#4a9d9a]">Enfermera Elite</p>
          </div>
          <div
            className={`rounded-lg px-2 py-1 flex items-center justify-center ${t(isDark, "bg-[#1e3a5f]", "bg-[#4a9d9a]")}`}
          >
            <span className="text-white text-[7px] font-semibold leading-none">Chat</span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════
   Screen 4: Chat
   ════════════════════════════════════════ */
function ChatScreen({ isDark }: ScreenProps) {
  return (
    <>
      <div className="bg-[#0f172a] px-4 pt-2 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-[8px]">&larr;</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center ring-1 ring-[#f59e0b]">
            <span className="text-white text-[7px] font-bold">MC</span>
          </div>
          <div className="flex-1">
            <p className="text-white text-[9px] font-semibold">Maria C.</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              <span className="text-[#22c55e] text-[7px]">En linea</span>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`px-3 py-3 flex-1 flex flex-col justify-end gap-2 ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}
      >
        <div className="flex items-center justify-center">
          <span
            className={`text-[7px] text-[#94a3b8] px-2 py-0.5 rounded-full shadow-sm ${t(isDark, "bg-white", "bg-[#1e293b]")}`}
          >
            Hoy, 14:30
          </span>
        </div>
        {/* Nurse message */}
        <div className="flex gap-1.5 max-w-[85%]">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center flex-shrink-0 mt-auto">
            <span className="text-white text-[6px] font-bold">MC</span>
          </div>
          <div>
            <div
              className={`rounded-2xl rounded-bl-sm px-2.5 py-1.5 shadow-sm border ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
            >
              <p
                className={`text-[8px] ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
              >
                Hola Maria, confirmo tu servicio de inyeccion para las 3pm. Ya
                estoy en camino.
              </p>
            </div>
            <span className="text-[6px] text-[#94a3b8] ml-1">14:30</span>
          </div>
        </div>
        {/* User message */}
        <div className="flex justify-end max-w-[80%] ml-auto">
          <div>
            <div
              className={`rounded-2xl rounded-br-sm px-2.5 py-1.5 ${t(isDark, "bg-[#1e3a5f]", "bg-[#4a9d9a]")}`}
            >
              <p
                className={`text-[8px] ${t(isDark, "text-white", "text-[#0f172a]")}`}
              >
                Perfecto, gracias! Te espero.
              </p>
            </div>
            <div className="flex items-center justify-end gap-0.5 mt-0.5">
              <span className="text-[6px] text-[#94a3b8]">14:31</span>
              <span className="text-[6px] text-[#4a9d9a]">
                &#10003;&#10003;
              </span>
            </div>
          </div>
        </div>
        {/* Typing indicator */}
        <div className="flex gap-1.5 max-w-[40%]">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center flex-shrink-0 mt-auto">
            <span className="text-white text-[6px] font-bold">MC</span>
          </div>
          <div
            className={`rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm border flex items-center gap-1 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
          >
            <span className="w-1 h-1 rounded-full bg-[#94a3b8] animate-bounce [animation-delay:0ms]" />
            <span className="w-1 h-1 rounded-full bg-[#94a3b8] animate-bounce [animation-delay:150ms]" />
            <span className="w-1 h-1 rounded-full bg-[#94a3b8] animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
        {/* Input bar */}
        <div
          className={`rounded-full px-3 py-1.5 flex items-center gap-2 shadow-sm border mt-1 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
        >
          <div
            className={`w-4 h-4 rounded-full ${t(isDark, "bg-[#e2e8f0]", "bg-[#334155]")}`}
          />
          <span className="text-[8px] text-[#94a3b8] flex-1">
            Escribe un mensaje...
          </span>
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center ${t(isDark, "bg-[#1e3a5f]", "bg-[#4a9d9a]")}`}
          >
            <span className="text-white text-[7px]">&uarr;</span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════
   Screen 5: Security Code
   ════════════════════════════════════════ */
function SecurityCodeScreen({ isDark }: ScreenProps) {
  const [seconds, setSeconds] = useState(247);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 299));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <>
      <div className="bg-[#0f172a] px-4 pt-2 pb-3">
        <div className="flex items-center justify-between">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-[8px]">&larr;</span>
          </div>
          <span className="text-white text-[9px] font-semibold">
            Verificacion
          </span>
          <div className="w-5 h-5" />
        </div>
      </div>
      <div
        className={`px-4 py-4 flex-1 flex flex-col items-center ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}
      >
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center mb-3 shadow-lg">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <p
          className={`text-[10px] font-bold mb-0.5 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
        >
          Codigo de Seguridad
        </p>
        <p className="text-[7px] text-[#64748b] text-center mb-3 px-2 leading-relaxed">
          Comparte este codigo con tu enfermera al llegar
        </p>
        <div className="flex gap-1.5 mb-3">
          {["4", "7", "2", "8", "1", "5"].map((digit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className={`w-8 h-10 rounded-lg flex items-center justify-center text-base font-bold shadow-sm border ${t(isDark, "bg-white border-[#e2e8f0] text-[#1a1a2e]", "bg-[#1e293b] border-[#334155] text-[#f1f5f9]")}`}
            >
              {digit}
            </motion.div>
          ))}
        </div>
        <div
          className={`rounded-full px-3 py-1 flex items-center gap-1.5 mb-3 ${t(isDark, "bg-[#4a9d9a]/10", "bg-[#4a9d9a]/20")}`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#4a9d9a] animate-pulse" />
          <span className="text-[8px] font-mono font-semibold text-[#4a9d9a]">
            Expira en {String(mins).padStart(2, "0")}:
            {String(secs).padStart(2, "0")}
          </span>
        </div>
        <div
          className={`rounded-xl p-2.5 w-full border ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
        >
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 rounded-full bg-[#22c55e]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#22c55e] text-[6px] font-bold">
                {"\u2713"}
              </span>
            </div>
            <div>
              <p
                className={`text-[7px] font-semibold mb-0.5 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
              >
                Verificacion doble
              </p>
              <p className="text-[6px] text-[#64748b] leading-relaxed">
                La enfermera ingresa este codigo al llegar para confirmar su
                identidad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════
   Screen 6: Payment
   ════════════════════════════════════════ */
function PaymentScreen({ isDark }: ScreenProps) {
  return (
    <>
      <div className="bg-[#0f172a] px-4 pt-2 pb-3">
        <div className="flex items-center justify-between">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-[8px]">&larr;</span>
          </div>
          <span className="text-white text-[9px] font-semibold">
            Pago Seguro
          </span>
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-[7px]">&#128274;</span>
          </div>
        </div>
      </div>
      <div
        className={`px-4 py-3 flex-1 ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}
      >
        <div
          className={`rounded-xl p-3 shadow-sm border mb-3 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
        >
          <p className="text-[8px] text-[#64748b] mb-1">
            Resumen del servicio
          </p>
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${t(isDark, "bg-[#4a9d9a]/10", "bg-[#4a9d9a]/20")}`}
            >
              <div className="w-4 h-4 rounded bg-[#4a9d9a]" />
            </div>
            <div className="flex-1">
              <p
                className={`text-[9px] font-semibold ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
              >
                Inyeccion Intramuscular
              </p>
              <p className="text-[7px] text-[#64748b]">
                Maria C. - Elite - 30 min
              </p>
            </div>
          </div>
          <div
            className={`border-t pt-2 flex justify-between ${t(isDark, "border-[#e2e8f0]", "border-[#334155]")}`}
          >
            <span className="text-[8px] text-[#64748b]">Total</span>
            <span
              className={`text-[12px] font-bold ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
            >
              S/ 40.00
            </span>
          </div>
        </div>
        <p
          className={`text-[8px] font-semibold mb-2 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
        >
          Metodo de pago
        </p>
        <div className="space-y-1.5 mb-3">
          <div
            className={`rounded-xl p-2.5 shadow-sm border-2 border-[#4a9d9a] flex items-center gap-2.5 ${t(isDark, "bg-white", "bg-[#1e293b]")}`}
          >
            <div className="w-8 h-5 rounded bg-gradient-to-r from-[#1A1F71] to-[#2566AF] flex items-center justify-center">
              <span className="text-white text-[6px] font-bold">VISA</span>
            </div>
            <div className="flex-1">
              <p
                className={`text-[8px] font-medium ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
              >
                **** **** **** 4532
              </p>
            </div>
            <div className="w-3 h-3 rounded-full bg-[#4a9d9a] flex items-center justify-center">
              <span className="text-white text-[6px]">&#10003;</span>
            </div>
          </div>
          <div
            className={`rounded-xl p-2.5 shadow-sm border flex items-center gap-2.5 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
          >
            <div className="w-8 h-5 rounded bg-[#6C2DC7] flex items-center justify-center">
              <span className="text-white text-[6px] font-bold">Yape</span>
            </div>
            <p
              className={`text-[8px] ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
            >
              Pagar con Yape
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 mb-2.5">
          <span className="text-[7px]">&#128274;</span>
          <span className="text-[7px] text-[#64748b]">
            Procesado por Culqi - SSL 256-bit
          </span>
        </div>
        <div
          className={`rounded-xl py-2.5 flex items-center justify-center ${t(isDark, "bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a]", "bg-gradient-to-r from-[#4a9d9a] to-[#6bb5b3]")}`}
        >
          <span className="text-white text-[9px] font-semibold leading-none">
            Pagar S/ 40.00
          </span>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════
   Screen 7: Nurse Dashboard (NEW)
   ════════════════════════════════════════ */
function NurseDashboardScreen({ isDark }: ScreenProps) {
  return (
    <>
      <div className="bg-gradient-to-b from-[#1e3a5f] to-[#4a9d9a] px-4 pt-2 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/60 text-[8px]">Panel Profesional</p>
            <p className="text-white font-bold text-[11px]">Hola, Maria C.</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-2 py-1">
            <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
            <span className="text-white text-[7px] font-medium">
              Disponible
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {[
            { val: "4.9", lbl: "Rating" },
            { val: "52", lbl: "Servicios" },
            { val: "S/3.2k", lbl: "Este mes" },
          ].map((s) => (
            <div
              key={s.lbl}
              className="flex-1 bg-white/15 rounded-xl p-2 text-center backdrop-blur-sm"
            >
              <p className="text-white text-[10px] font-bold">{s.val}</p>
              <p className="text-white/60 text-[6px]">{s.lbl}</p>
            </div>
          ))}
        </div>
      </div>
      <div
        className={`px-3 py-3 flex-1 ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}
      >
        <p
          className={`text-[9px] font-semibold mb-2 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
        >
          Solicitud Pendiente
        </p>
        <div
          className={`rounded-xl p-2.5 shadow-sm border mb-3 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${t(isDark, "bg-[#f59e0b]/10", "bg-[#f59e0b]/20")}`}
            >
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
            </div>
            <div className="flex-1">
              <p
                className={`text-[9px] font-semibold ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
              >
                Rosa G.
              </p>
              <p className="text-[7px] text-[#64748b]">
                Inyeccion IM - 2.3 km - S/50
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <div className="flex-1 rounded-lg py-1.5 flex items-center justify-center bg-[#ef4444]/10 border border-[#ef4444]/20">
              <span className="text-[8px] font-semibold leading-none text-[#ef4444]">
                Rechazar
              </span>
            </div>
            <div
              className={`flex-1 rounded-lg py-1.5 flex items-center justify-center ${t(isDark, "bg-[#1e3a5f]", "bg-[#4a9d9a]")}`}
            >
              <span className="text-white text-[8px] font-semibold leading-none">
                Aceptar
              </span>
            </div>
          </div>
        </div>
        <p
          className={`text-[9px] font-semibold mb-1.5 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
        >
          Acciones Rapidas
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "Mis Servicios", color: "#4a9d9a" },
            { label: "Ganancias", color: "#f59e0b" },
            { label: "Resenas", color: "#8b5cf6" },
            { label: "Mi Perfil", color: "#3b82f6" },
          ].map((a) => (
            <div
              key={a.label}
              className={`rounded-xl p-2 text-center border ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
            >
              <div
                className="w-6 h-6 rounded-lg mx-auto mb-1 flex items-center justify-center"
                style={{ background: `${a.color}15` }}
              >
                <div
                  className="w-3 h-3 rounded"
                  style={{ background: a.color }}
                />
              </div>
              <p
                className={`text-[7px] font-medium ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
              >
                {a.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════
   Screen 8: Tier System (NEW)
   ════════════════════════════════════════ */
const tiers = [
  {
    name: "Certificada",
    color: "#4a9d9a",
    req: "Verificacion CEP",
    filled: true,
  },
  {
    name: "Destacada",
    color: "#3b82f6",
    req: "10+ servicios, 4.0+",
    filled: true,
  },
  {
    name: "Experimentada",
    color: "#8b5cf6",
    req: "30+ servicios, 4.5+",
    filled: false,
  },
  {
    name: "Elite",
    color: "#f59e0b",
    req: "50+ servicios, 4.7+",
    filled: false,
  },
];

function TierScreen({ isDark }: ScreenProps) {
  return (
    <>
      <div className="bg-[#0f172a] px-4 pt-2 pb-3">
        <div className="flex items-center justify-between">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-[8px]">&larr;</span>
          </div>
          <span className="text-white text-[9px] font-semibold">Mi Nivel</span>
          <div className="w-5 h-5" />
        </div>
      </div>
      <div
        className={`px-4 py-3 flex-1 flex flex-col items-center ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}
      >
        {/* Current tier avatar */}
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center ring-3 ring-[#3b82f6] shadow-lg">
            <span className="text-white text-lg font-bold">MC</span>
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
            <span className="text-[7px] px-2 py-0.5 rounded-full bg-[#3b82f6] text-white font-bold shadow-sm whitespace-nowrap">
              DESTACADA
            </span>
          </div>
        </div>
        <p
          className={`text-[10px] font-bold mt-1 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
        >
          Maria Claudia
        </p>
        <p className="text-[7px] text-[#64748b] mb-3">Nivel 2 de 4</p>

        {/* Progress to next tier */}
        <div
          className={`w-full rounded-xl p-2.5 border mb-3 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[7px] text-[#3b82f6] font-semibold">
              Destacada
            </span>
            <span className="text-[7px] text-[#8b5cf6] font-semibold">
              Experimentada
            </span>
          </div>
          <div
            className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-[#334155]" : "bg-[#e2e8f0]"}`}
          >
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "65%" }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]"
            />
          </div>
          <p className="text-[6px] text-[#64748b] mt-1 text-center">
            18 de 30 servicios completados
          </p>
        </div>

        {/* Tier ladder */}
        <div className="w-full space-y-1.5">
          {tiers.map((tier, i) => (
            <div
              key={tier.name}
              className={`rounded-lg p-2 flex items-center gap-2.5 border transition-all ${
                i <= 1
                  ? t(
                      isDark,
                      "bg-white border-[#e2e8f0]",
                      "bg-[#1e293b] border-[#334155]"
                    )
                  : t(
                      isDark,
                      "bg-[#f1f5f9] border-[#e2e8f0]",
                      "bg-[#1e293b]/50 border-[#334155]/50"
                    )
              }`}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: tier.filled
                    ? tier.color
                    : isDark
                      ? "#334155"
                      : "#e2e8f0",
                }}
              >
                {tier.filled ? (
                  <span className="text-white text-[7px] font-bold">
                    {"\u2713"}
                  </span>
                ) : (
                  <span
                    className={`text-[7px] ${isDark ? "text-[#64748b]" : "text-[#94a3b8]"}`}
                  >
                    {i + 1}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`text-[8px] font-semibold ${
                    tier.filled
                      ? t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")
                      : "text-[#94a3b8]"
                  }`}
                >
                  {tier.name}
                </p>
                <p className="text-[6px] text-[#64748b]">{tier.req}</p>
              </div>
              {i === 1 && (
                <span className="text-[6px] px-1.5 py-0.5 rounded-full bg-[#3b82f6]/15 text-[#3b82f6] font-bold">
                  ACTUAL
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Screen registry ── */
const screens = [
  HomeScreen,
  NurseProfileScreen,
  TrackingScreen,
  ChatScreen,
  SecurityCodeScreen,
  PaymentScreen,
  NurseDashboardScreen,
  TierScreen,
];

/* ════════════════════════════════════════
   Main AppFeatures Component
   ════════════════════════════════════════ */
export function AppFeatures() {
  const [activeScreen, setActiveScreen] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const shouldReduceMotion = useReducedMotion();

  const nextScreen = useCallback(() => {
    setActiveScreen((prev) => (prev + 1) % screens.length);
  }, []);

  useEffect(() => {
    if (isPaused || shouldReduceMotion) return;
    const timer = setTimeout(nextScreen, slideDurations[activeScreen]);
    return () => clearTimeout(timer);
  }, [isPaused, nextScreen, activeScreen, shouldReduceMotion]);

  const ActiveScreenComponent = screens[activeScreen];

  return (
    <section
      id="tecnologia"
      className="pt-12 pb-12 md:pt-16 md:pb-16 relative overflow-hidden"
      aria-labelledby="features-title"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f8fafc] to-white dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a]" />
      <div className="absolute top-20 left-0 w-72 h-72 bg-[#4a9d9a]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-0 w-96 h-96 bg-[#1e3a5f]/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a5f]/10 dark:bg-[#4a9d9a]/20 text-[#1e3a5f] dark:text-[#4a9d9a] rounded-full text-sm font-semibold mb-4">
            <Smartphone className="w-4 h-4" />
            Tecnologia de Confianza
          </span>
          <h2
            id="features-title"
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a1a2e] dark:text-white mb-6"
          >
            Una app disenada para{" "}
            <span className="gradient-text">tu tranquilidad</span>
          </h2>
          <p className="text-lg text-[#64748b] dark:text-[#94a3b8]">
            Tecnologia que pone tu bienestar primero. Desde la verificacion
            hasta el seguimiento en tiempo real.
          </p>
        </AnimatedSection>

        {/* Content: Feature List + Phone */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:gap-16 items-start">
          {/* Feature list */}
          <div className="order-2 lg:order-1">
            {/* Desktop: vertical list */}
            <div className="hidden lg:block space-y-1">
              {features.map((feature, i) => (
                <button
                  key={i}
                  onClick={() => setActiveScreen(i)}
                  className={`w-full text-left rounded-xl p-3.5 transition-all duration-300 border-l-[3px] ${
                    i === activeScreen
                      ? "bg-white dark:bg-[#1e293b] shadow-sm"
                      : "border-transparent hover:bg-white/50 dark:hover:bg-[#1e293b]/30"
                  }`}
                  style={
                    i === activeScreen
                      ? { borderLeftColor: feature.color }
                      : {}
                  }
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                        i !== activeScreen
                          ? "bg-[#f1f5f9] dark:bg-[#334155]"
                          : ""
                      }`}
                      style={
                        i === activeScreen
                          ? {
                              background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}40)`,
                            }
                          : {}
                      }
                    >
                      <feature.icon
                        className="w-[18px] h-[18px]"
                        style={{
                          color:
                            i === activeScreen ? feature.color : "#94a3b8",
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold transition-colors ${
                          i === activeScreen
                            ? "text-[#1a1a2e] dark:text-white"
                            : "text-[#64748b] dark:text-[#94a3b8]"
                        }`}
                      >
                        {feature.title}
                      </p>
                      <AnimatePresence mode="wait">
                        {i === activeScreen && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-0.5 leading-relaxed"
                          >
                            {feature.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  {/* Progress bar */}
                  {i === activeScreen && !isPaused && (
                    <motion.div
                      key={`progress-${activeScreen}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        duration: slideDurations[i] / 1000,
                        ease: "linear",
                      }}
                      className="h-0.5 mt-2.5 ml-12 rounded-full origin-left"
                      style={{ background: feature.color }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Mobile: horizontal scrollable chips */}
            <div className="lg:hidden flex overflow-x-auto gap-2 pb-3 -mx-2 px-2 scrollbar-hide">
              {features.map((feature, i) => (
                <button
                  key={i}
                  onClick={() => setActiveScreen(i)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all border ${
                    i === activeScreen
                      ? "bg-white dark:bg-[#1e293b] shadow-sm border-[#e2e8f0] dark:border-[#334155] text-[#1a1a2e] dark:text-white"
                      : "border-transparent text-[#64748b] dark:text-[#94a3b8]"
                  }`}
                >
                  <feature.icon
                    className="w-3.5 h-3.5"
                    style={
                      i === activeScreen ? { color: feature.color } : {}
                    }
                  />
                  {feature.title}
                </button>
              ))}
            </div>
          </div>

          {/* Phone carousel */}
          <AnimatedSection
            direction="right"
            className="order-1 lg:order-2 lg:sticky lg:top-28"
          >
            <div
              className="relative w-[300px] mx-auto"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] blur-[60px] rounded-full scale-110 transition-opacity duration-500 ${
                  isDark ? "opacity-25" : "opacity-15"
                }`}
              />

              {/* Phone frame */}
              <div
                className={`relative bg-[#0f172a] rounded-[3.5rem] p-3.5 transition-shadow duration-500 ${
                  isDark
                    ? "shadow-[0_0_50px_rgba(74,157,154,0.2),0_0_100px_rgba(74,157,154,0.1)] ring-1 ring-[#4a9d9a]/20"
                    : "shadow-2xl"
                }`}
              >
                <div
                  className={`rounded-[3rem] overflow-hidden aspect-[9/19] flex flex-col ${t(isDark, "bg-white", "bg-[#0f172a]")}`}
                >
                  {/* Status bar */}
                  <div className="bg-[#0f172a] px-6 pt-3 pb-1.5 flex justify-between items-center text-white text-[10px] flex-shrink-0">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5 items-end">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="w-0.5 rounded-full bg-white"
                            style={{ height: `${(i + 2) * 2}px` }}
                          />
                        ))}
                      </div>
                      <div className="w-3.5 h-2 border border-white/80 rounded-sm relative ml-1">
                        <div className="absolute inset-0.5 bg-white/80 rounded-[1px]" />
                      </div>
                    </div>
                  </div>

                  {/* Screen content */}
                  <div className="flex-1 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeScreen}
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -60 }}
                        transition={{
                          duration: 0.4,
                          ease: [0.25, 0.1, 0.25, 1],
                        }}
                        className="absolute inset-0 flex flex-col overflow-hidden"
                      >
                        <ActiveScreenComponent isDark={isDark} />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Tab bar */}
                  <div
                    className={`border-t px-5 py-1.5 flex justify-between flex-shrink-0 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#0f172a] border-[#334155]")}`}
                  >
                    {["Inicio", "Buscar", "Citas", "Perfil"].map((item, i) => (
                      <div
                        key={item}
                        className="flex flex-col items-center gap-0.5"
                      >
                        <div
                          className={`w-4 h-4 rounded-sm ${
                            i === 0
                              ? isDark
                                ? "bg-[#4a9d9a]"
                                : "bg-[#1e3a5f]"
                              : t(isDark, "bg-[#cbd5e1]", "bg-[#334155]")
                          }`}
                        />
                        <span
                          className={`text-[7px] ${
                            i === 0
                              ? isDark
                                ? "text-[#4a9d9a] font-semibold"
                                : "text-[#1e3a5f] font-semibold"
                              : "text-[#94a3b8]"
                          }`}
                        >
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic island */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full" />
              </div>

              {/* Carousel dots */}
              <div className="flex items-center justify-center gap-1.5 mt-5">
                {screenLabels.map((label, i) => (
                  <button
                    key={label}
                    onClick={() => setActiveScreen(i)}
                    aria-label={`Ver pantalla: ${label}`}
                    className={`transition-all duration-300 rounded-full ${
                      i === activeScreen
                        ? "w-6 h-2 bg-[#4a9d9a]"
                        : "w-2 h-2 bg-[#94a3b8] hover:bg-[#64748b]"
                    }`}
                  />
                ))}
              </div>

              {/* Screen label */}
              <p className="text-center text-xs text-[#94a3b8] dark:text-[#64748b] mt-2 font-medium">
                {screenLabels[activeScreen]}
              </p>

              {/* App Store badges */}
              <div className="mt-5 text-center">
                <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mb-2.5">
                  Proximamente en
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-black/80 dark:bg-white/10 rounded-lg">
                    <svg
                      className="w-5 h-5 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    <span className="text-xs font-medium text-white">iOS</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-black/80 dark:bg-white/10 rounded-lg">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M3.609 1.814L13.445 12 3.609 22.186a2.02 2.02 0 0 1-.609-1.452V3.266c0-.56.226-1.066.609-1.452z"
                      />
                      <path
                        fill="#FBBC04"
                        d="M16.547 8.85l-3.1 3.15 3.1 3.15 3.502-2.017c.79-.455.79-1.61 0-2.066L16.547 8.85z"
                      />
                      <path
                        fill="#4285F4"
                        d="M3.609 1.814L13.445 12l3.102-3.15L6.167.473c-.451-.26-.954-.39-1.447-.39-.403 0-.8.086-1.111.259L3.609 1.814z"
                      />
                      <path
                        fill="#34A853"
                        d="M3.609 22.186l.001-.001L6.167 23.527c-.002 0 10.378-5.987 10.38-5.988l-3.102-3.15L3.609 22.186z"
                      />
                    </svg>
                    <span className="text-xs font-medium text-white">
                      Android
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
