"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatedSection } from "./ui/AnimatedSection";
import { useTheme } from "./ThemeProvider";

/* ── Theme helper ── */
const t = (isDark: boolean, light: string, dark: string) =>
  isDark ? dark : light;

/* ── Reusable star SVG ── */
const StarIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-2 h-2 text-[#f59e0b]">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

/* ── Typing effect hook ── */
function useTypingEffect(text: string, speed: number, startDelay: number, active: boolean) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) {
      setDisplayed("");
      setDone(false);
      return;
    }
    setDisplayed("");
    setDone(false);
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay, active]);

  return { displayed, done };
}

/* ── Typing field component ── */
function TypingField({
  label,
  value,
  speed = 50,
  startDelay = 0,
  active,
  isDark,
  icon,
}: {
  label: string;
  value: string;
  speed?: number;
  startDelay?: number;
  active: boolean;
  isDark: boolean;
  icon?: string;
}) {
  const { displayed, done } = useTypingEffect(value, speed, startDelay, active);
  const showCursor = active && displayed.length > 0 && !done;

  return (
    <div
      className={`rounded-lg px-2.5 py-1.5 border ${t(
        isDark,
        "bg-white border-[#e2e8f0]",
        "bg-[#1e293b] border-[#334155]"
      )}`}
    >
      <p className="text-[6px] text-[#94a3b8] mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-[8px]">{icon}</span>}
        <p
          className={`text-[8px] font-medium min-h-[12px] ${t(
            isDark,
            "text-[#1a1a2e]",
            "text-[#f1f5f9]"
          )}`}
        >
          {displayed}
          {showCursor && (
            <span className="inline-block w-[1px] h-[10px] bg-[#4a9d9a] ml-[1px] align-middle animate-[blink_1s_step-end_infinite]" />
          )}
        </p>
      </div>
    </div>
  );
}

/* ── Mock data ── */
const nurseMockData = {
  firstName: "Maria Claudia",
  lastName: "Chavez Torres",
  email: "maria.chavez@gmail.com",
  cep: "108887",
  region: "CONSEJO REGIONAL III LIMA METROPOLITANA",
  status: "HABIL",
  initials: "MC",
};

const patientMockData = {
  firstName: "Ana",
  lastName: "Rodriguez",
  email: "ana.rodriguez@gmail.com",
  phone: "999888777",
};

/* ── Screen props ── */
interface ScreenProps {
  isDark: boolean;
}

/* ════════════════════════════════════════════════
   NURSE SCREENS (6)
   ════════════════════════════════════════════════ */

/* Screen 1: Nurse Landing - Role selection */
function NurseLandingScreen({ isDark }: ScreenProps) {
  return (
    <div className={`flex-1 flex flex-col ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
      {/* Tab selector */}
      <div className="flex mx-3 mt-2.5 mb-3 rounded-xl overflow-hidden border border-[#e2e8f0] dark:border-[#334155]">
        <div
          className={`flex-1 py-1.5 text-center text-[8px] font-medium ${t(
            isDark,
            "bg-white text-[#94a3b8]",
            "bg-[#1e293b] text-[#64748b]"
          )}`}
        >
          Busco Enfermera
        </div>
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 py-1.5 text-center text-[8px] font-semibold text-white bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a]"
        >
          Soy Enfermera
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center mb-3 shadow-lg"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
            <path d="M12 2L12 22M17 7H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </motion.div>

        <p className={`text-[11px] font-bold text-center mb-2 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
          Gana mas, trabaja cuando quieras
        </p>

        <div className="space-y-1.5 w-full mb-4">
          {[
            { text: "100% de tus ganancias", delay: 0.5 },
            { text: "Pacientes en tu zona", delay: 0.7 },
            { text: "Tu eliges tus horarios", delay: 0.9 },
          ].map((item) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: item.delay, duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <div className="w-4 h-4 rounded-full bg-[#22c55e]/15 flex items-center justify-center flex-shrink-0">
                <span className="text-[#22c55e] text-[6px] font-bold">{"\u2713"}</span>
              </div>
              <p className={`text-[8px] ${t(isDark, "text-[#475569]", "text-[#94a3b8]")}`}>
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={`w-full rounded-xl py-2.5 text-center ${t(isDark, "bg-[#1e3a5f]", "bg-[#4a9d9a]")}`}
        >
          <span className="text-white text-[9px] font-semibold">Empezar a ganar hoy</span>
        </motion.div>
      </div>
    </div>
  );
}

/* Screen 2: Nurse Registration form with typing */
function NurseRegistrationScreen({ isDark }: ScreenProps) {
  return (
    <div className={`flex-1 flex flex-col px-3 py-2.5 ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
      <p className={`text-[10px] font-bold mb-2.5 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
        Registro de Enfermera
      </p>

      <div className="space-y-1.5 flex-1">
        <TypingField label="Nombre" value={nurseMockData.firstName} speed={60} startDelay={300} active isDark={isDark} />
        <TypingField label="Apellido" value={nurseMockData.lastName} speed={50} startDelay={1200} active isDark={isDark} />
        <TypingField label="Email" value={nurseMockData.email} speed={40} startDelay={2200} active isDark={isDark} />
        <TypingField label="N. CEP" value={nurseMockData.cep} speed={80} startDelay={3400} active isDark={isDark} icon="&#128179;" />
      </div>

      {/* Terms checkbox */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4.2 }}
        className="flex items-center gap-2 mt-2 mb-2"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 4.5, type: "spring", stiffness: 300 }}
          className="w-3.5 h-3.5 rounded border border-[#4a9d9a] bg-[#4a9d9a] flex items-center justify-center"
        >
          <span className="text-white text-[6px] font-bold">{"\u2713"}</span>
        </motion.div>
        <p className="text-[6px] text-[#94a3b8]">Acepto los terminos y condiciones</p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 5.0, duration: 0.5 }}
        className={`rounded-xl py-2 text-center ${t(isDark, "bg-[#1e3a5f]", "bg-[#4a9d9a]")}`}
      >
        <span className="text-white text-[9px] font-semibold">Crear Cuenta</span>
      </motion.div>
    </div>
  );
}

/* Screen 3: CEP Validation */
function CEPValidationScreen({ isDark }: ScreenProps) {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const messages = ["Conectando con CEP...", "Verificando numero...", "Confirmando vigencia..."];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 2));
    }, 80);

    const msgInterval = setInterval(() => {
      setMsgIndex((prev) => (prev >= messages.length - 1 ? prev : prev + 1));
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(msgInterval);
    };
  }, [messages.length]);

  return (
    <div className={`flex-1 flex flex-col items-center justify-center px-4 ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
      {/* CEP Logo pulsing */}
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center mb-4 shadow-lg"
      >
        <span className="text-white text-[10px] font-bold text-center leading-tight">CEP</span>
      </motion.div>

      <p className={`text-[11px] font-bold mb-2 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
        Validando tu colegiatura
      </p>

      {/* Rotating messages */}
      <AnimatePresence mode="wait">
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-[8px] text-[#4a9d9a] font-medium mb-4"
        >
          {messages[msgIndex]}
        </motion.p>
      </AnimatePresence>

      {/* Progress bar */}
      <div className={`w-full h-2 rounded-full overflow-hidden ${t(isDark, "bg-[#e2e8f0]", "bg-[#334155]")}`}>
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
          className="h-full rounded-full bg-gradient-to-r from-[#22c55e] to-[#4a9d9a]"
        />
      </div>
      <p className="text-[7px] text-[#94a3b8] mt-1.5">{progress}%</p>
    </div>
  );
}

/* Screen 4: CEP Result + Confirmation */
function CEPResultScreen({ isDark }: ScreenProps) {
  return (
    <div className={`flex-1 flex flex-col items-center px-3.5 py-3 ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center mb-2 shadow-lg"
      >
        <span className="text-white text-sm font-bold">{nurseMockData.initials}</span>
      </motion.div>

      {/* HABIL badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.15, 1] }}
        transition={{ delay: 0.6, duration: 0.4, type: "spring" }}
        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#22c55e]/15 mb-2"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] flex items-center justify-center">
          <span className="text-white text-[5px] font-bold">{"\u2713"}</span>
        </div>
        <span className="text-[#22c55e] text-[8px] font-bold">HABIL</span>
      </motion.div>

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.4 }}
        className={`w-full rounded-xl p-2.5 border mb-3 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
      >
        {[
          { label: "Nombre", value: "CHAVEZ TORRES MARIA CLAUDIA" },
          { label: "CEP", value: nurseMockData.cep },
          { label: "Region", value: nurseMockData.region },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 + i * 0.25, duration: 0.3 }}
            className={`${i > 0 ? "mt-1.5 pt-1.5 border-t" : ""} ${t(isDark, "border-[#f1f5f9]", "border-[#334155]")}`}
          >
            <p className="text-[6px] text-[#94a3b8]">{item.label}</p>
            <p className={`text-[7px] font-semibold ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
              {item.value}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        className={`text-[8px] font-medium mb-2 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}
      >
        Esta informacion es correcta?
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.6, duration: 0.3 }}
        className="w-full rounded-xl py-2 text-center bg-[#22c55e]"
      >
        <span className="text-white text-[9px] font-semibold">Si, soy yo</span>
      </motion.div>
    </div>
  );
}

/* Screen 5: Quick setup */
function NurseSetupScreen({ isDark }: ScreenProps) {
  return (
    <div className={`flex-1 flex flex-col px-3.5 py-3 ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
      <p className={`text-[10px] font-bold mb-3 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
        Configura tu perfil
      </p>

      {/* Location */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className={`rounded-xl p-2.5 border mb-2 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[7px] text-[#94a3b8] mb-0.5">Ubicacion</p>
            <p className={`text-[8px] font-semibold ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
              Lima &gt; Miraflores
            </p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 0.8, type: "spring" }}
            className="w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center"
          >
            <span className="text-white text-[7px] font-bold">{"\u2713"}</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Payments */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.3 }}
        className={`rounded-xl p-2.5 border mb-2 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
      >
        <p className="text-[7px] text-[#94a3b8] mb-1">Recibir pagos</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#6C2DC7] flex items-center justify-center">
              <span className="text-white text-[5px] font-bold">Yape</span>
            </div>
            <p className={`text-[8px] font-medium ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
              987654321
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="w-8 h-4 rounded-full bg-[#22c55e] flex items-center justify-end px-0.5"
          >
            <div className="w-3 h-3 rounded-full bg-white" />
          </motion.div>
        </div>
      </motion.div>

      {/* Plan */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.3 }}
        className={`rounded-xl p-2.5 border mb-2 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
      >
        <p className="text-[7px] text-[#94a3b8] mb-1">Plan</p>
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.15, 1] }}
            transition={{ delay: 2.3, type: "spring" }}
            className="px-2 py-1 rounded-lg bg-[#4a9d9a]/15 border border-[#4a9d9a]/30"
          >
            <span className="text-[7px] font-bold text-[#4a9d9a]">Basico - Gratis</span>
          </motion.div>
          <span className="text-[6px] text-[#94a3b8]">Comienza sin costo</span>
        </div>
      </motion.div>

      <div className="flex-1" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.0 }}
        className={`rounded-xl py-2 text-center ${t(isDark, "bg-[#1e3a5f]", "bg-[#4a9d9a]")}`}
      >
        <span className="text-white text-[9px] font-semibold">Continuar</span>
      </motion.div>
    </div>
  );
}

/* Screen 6: Nurse Dashboard ready */
function NurseDashboardReadyScreen({ isDark }: ScreenProps) {
  return (
    <>
      <div className="bg-gradient-to-b from-[#1e3a5f] to-[#4a9d9a] px-4 pt-2 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex items-center justify-between mb-2.5"
        >
          <div>
            <p className="text-white/60 text-[8px]">Panel Profesional</p>
            <p className="text-white font-bold text-[11px]">Hola, Maria</p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex items-center gap-1.5 bg-white/15 rounded-full px-2 py-1"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2, type: "spring" }}
              className="w-2 h-2 rounded-full bg-[#22c55e]"
            />
            <span className="text-white text-[7px] font-medium">Disponible</span>
          </motion.div>
        </motion.div>
        <div className="flex gap-2">
          {[
            { val: "4.8", lbl: "Rating" },
            { val: "0", lbl: "Servicios" },
            { val: "S/0", lbl: "Este mes" },
          ].map((s, i) => (
            <motion.div
              key={s.lbl}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              className="flex-1 bg-white/15 rounded-xl p-2 text-center backdrop-blur-sm"
            >
              <p className="text-white text-[10px] font-bold">{s.val}</p>
              <p className="text-white/60 text-[6px]">{s.lbl}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <div className={`px-3 py-3 flex-1 ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
        <p className={`text-[9px] font-semibold mb-2 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
          Solicitud Cercana
        </p>
        {/* Shimmer card */}
        <motion.div
          className={`rounded-xl p-3 border overflow-hidden relative ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
        >
          <div className="flex items-center gap-2.5 mb-2 relative z-10">
            <div className={`w-8 h-8 rounded-full ${t(isDark, "bg-[#e2e8f0]", "bg-[#334155]")}`} />
            <div className="flex-1 space-y-1">
              <div className={`h-2 rounded w-20 ${t(isDark, "bg-[#e2e8f0]", "bg-[#334155]")}`} />
              <div className={`h-1.5 rounded w-28 ${t(isDark, "bg-[#f1f5f9]", "bg-[#475569]")}`} />
            </div>
          </div>
          {/* Shimmer overlay */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
        </motion.div>

        <p className={`text-[9px] font-semibold mt-3 mb-1.5 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
          Acciones Rapidas
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "Servicios", color: "#4a9d9a" },
            { label: "Ganancias", color: "#f59e0b" },
            { label: "Resenas", color: "#8b5cf6" },
            { label: "Perfil", color: "#3b82f6" },
          ].map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 + i * 0.12 }}
              className={`rounded-xl p-1.5 text-center border ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
            >
              <div
                className="w-5 h-5 rounded-lg mx-auto mb-0.5 flex items-center justify-center"
                style={{ background: `${a.color}15` }}
              >
                <div className="w-2.5 h-2.5 rounded" style={{ background: a.color }} />
              </div>
              <p className={`text-[6px] font-medium ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
                {a.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════
   PATIENT SCREENS (6)
   ════════════════════════════════════════════════ */

/* Screen 1: Patient Landing - Role selection */
function PatientLandingScreen({ isDark }: ScreenProps) {
  return (
    <div className={`flex-1 flex flex-col ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
      {/* Tab selector */}
      <div className="flex mx-3 mt-2.5 mb-3 rounded-xl overflow-hidden border border-[#e2e8f0] dark:border-[#334155]">
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 py-1.5 text-center text-[8px] font-semibold text-white bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a]"
        >
          Busco Enfermera
        </motion.div>
        <div
          className={`flex-1 py-1.5 text-center text-[8px] font-medium ${t(
            isDark,
            "bg-white text-[#94a3b8]",
            "bg-[#1e293b] text-[#64748b]"
          )}`}
        >
          Soy Enfermera
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a] flex items-center justify-center mb-3 shadow-lg"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </motion.div>

        <p className={`text-[11px] font-bold text-center mb-2 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
          Atencion profesional en tu casa
        </p>

        <div className="space-y-1.5 w-full mb-4">
          {[
            { text: "Colegiatura verificada CEP", delay: 0.5 },
            { text: "Atencion en menos de 2 horas", delay: 0.7 },
            { text: "Precios claros", delay: 0.9 },
          ].map((item) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: item.delay, duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <div className="w-4 h-4 rounded-full bg-[#22c55e]/15 flex items-center justify-center flex-shrink-0">
                <span className="text-[#22c55e] text-[6px] font-bold">{"\u2713"}</span>
              </div>
              <p className={`text-[8px] ${t(isDark, "text-[#475569]", "text-[#94a3b8]")}`}>
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={`w-full rounded-xl py-2.5 text-center ${t(isDark, "bg-[#1e3a5f]", "bg-[#4a9d9a]")}`}
        >
          <span className="text-white text-[9px] font-semibold">Encontrar enfermera cerca</span>
        </motion.div>
      </div>
    </div>
  );
}

/* Screen 2: Patient Registration */
function PatientRegistrationScreen({ isDark }: ScreenProps) {
  return (
    <div className={`flex-1 flex flex-col px-3 py-2.5 ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
      <p className={`text-[10px] font-bold mb-2.5 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
        Registro de Paciente
      </p>

      <div className="space-y-1.5 flex-1">
        <TypingField label="Nombre" value={patientMockData.firstName} speed={70} startDelay={300} active isDark={isDark} />
        <TypingField label="Apellido" value={patientMockData.lastName} speed={55} startDelay={900} active isDark={isDark} />
        <TypingField label="Email" value={patientMockData.email} speed={35} startDelay={1700} active isDark={isDark} />
        <TypingField label="Telefono" value={patientMockData.phone} speed={70} startDelay={2800} active isDark={isDark} icon="&#128222;" />
      </div>

      {/* Terms */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5 }}
        className="flex items-center gap-2 mt-2 mb-2"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 3.8, type: "spring", stiffness: 300 }}
          className="w-3.5 h-3.5 rounded border border-[#4a9d9a] bg-[#4a9d9a] flex items-center justify-center"
        >
          <span className="text-white text-[6px] font-bold">{"\u2713"}</span>
        </motion.div>
        <p className="text-[6px] text-[#94a3b8]">Acepto los terminos y condiciones</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4.0, duration: 0.5 }}
        className={`rounded-xl py-2 text-center ${t(isDark, "bg-[#1e3a5f]", "bg-[#4a9d9a]")}`}
      >
        <span className="text-white text-[9px] font-semibold">Crear Cuenta</span>
      </motion.div>
    </div>
  );
}

/* Screen 3: Patient Home/Dashboard */
function PatientHomeScreen({ isDark }: ScreenProps) {
  return (
    <>
      <div className="bg-gradient-to-b from-[#1e3a5f] to-[#4a9d9a] px-4 pt-2 pb-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-white/60 text-[8px]">Bienvenida</p>
          <p className="text-white font-bold text-[11px]">Hola Ana, como te ayudamos hoy?</p>
        </motion.div>
      </div>
      <div className={`px-3 py-3 flex-1 -mt-3 ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`rounded-xl p-3 border flex items-center gap-2.5 mb-3 ${t(isDark, "bg-white border-[#e2e8f0] shadow-sm", "bg-[#1e293b] border-[#334155]")}`}
        >
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a] flex items-center justify-center flex-shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </motion.div>
          <div>
            <p className={`text-[9px] font-bold ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
              Necesito una enfermera
            </p>
            <p className="text-[7px] text-[#64748b]">Encuentra profesionales verificadas</p>
          </div>
        </motion.div>

        {/* Trust badges */}
        <div className="flex gap-1.5 mb-3">
          {[
            { text: "100% Verificadas", icon: "&#9989;" },
            { text: "Atencion 24/7", icon: "&#128337;" },
            { text: "+500 servicios", icon: "&#11088;" },
          ].map((badge, i) => (
            <motion.div
              key={badge.text}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 + i * 0.15 }}
              className={`flex-1 rounded-lg p-1.5 text-center border ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
            >
              <span className="text-[8px] block mb-0.5" dangerouslySetInnerHTML={{ __html: badge.icon }} />
              <p className={`text-[6px] font-medium ${t(isDark, "text-[#475569]", "text-[#94a3b8]")}`}>
                {badge.text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Quick access */}
        <p className={`text-[8px] font-semibold mb-1.5 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
          Acceso Rapido
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: "Historial", color: "#4a9d9a" },
            { label: "Favoritas", color: "#f59e0b" },
            { label: "Ajustes", color: "#64748b" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 + i * 0.12 }}
              className={`rounded-xl p-2 text-center border ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
            >
              <div
                className="w-5 h-5 rounded-lg mx-auto mb-0.5 flex items-center justify-center"
                style={{ background: `${item.color}15` }}
              >
                <div className="w-2.5 h-2.5 rounded" style={{ background: item.color }} />
              </div>
              <p className={`text-[6px] font-medium ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}

/* Screen 4: Map with nurses */
function PatientMapScreen({ isDark }: ScreenProps) {
  return (
    <div className={`flex-1 flex flex-col ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
      {/* Simulated map */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className={`absolute inset-0 ${t(
            isDark,
            "bg-gradient-to-br from-[#e2e8f0] via-[#f1f5f9] to-[#e2e8f0]",
            "bg-gradient-to-br from-[#1e293b] via-[#334155] to-[#1e293b]"
          )}`}
        >
          {/* Grid lines for map feel */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(8)].map((_, i) => (
              <div key={`h-${i}`} className={`absolute w-full h-px ${t(isDark, "bg-[#94a3b8]", "bg-[#475569]")}`} style={{ top: `${(i + 1) * 12}%` }} />
            ))}
            {[...Array(6)].map((_, i) => (
              <div key={`v-${i}`} className={`absolute h-full w-px ${t(isDark, "bg-[#94a3b8]", "bg-[#475569]")}`} style={{ left: `${(i + 1) * 16}%` }} />
            ))}
          </div>

          {/* Nurse markers */}
          {[
            { top: "25%", left: "30%", initials: "MC", delay: 0.3 },
            { top: "40%", left: "60%", initials: "LP", delay: 0.5 },
            { top: "55%", left: "25%", initials: "RS", delay: 0.7 },
            { top: "35%", left: "75%", initials: "AT", delay: 0.9 },
          ].map((marker, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: 1 }}
              transition={{ delay: marker.delay, duration: 0.4, type: "spring" }}
              className="absolute"
              style={{ top: marker.top, left: marker.left }}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center ring-2 ring-white dark:ring-[#0f172a] shadow-md">
                <span className="text-white text-[6px] font-bold">{marker.initials}</span>
              </div>
            </motion.div>
          ))}

          {/* Badge: enfermeras cerca */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-[#1e3a5f] shadow-lg"
          >
            <span className="text-white text-[8px] font-semibold">4 enfermeras cerca</span>
          </motion.div>
        </div>
      </div>

      {/* Bottom card */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.4, type: "spring" }}
        className={`px-3 py-2.5 border-t ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
      >
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center ring-2 ring-[#f59e0b]">
            <span className="text-white text-[6px] font-bold">MC</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <p className={`text-[9px] font-semibold ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
                Maria C.
              </p>
              <div className="flex items-center gap-0.5">
                <StarIcon />
                <span className="text-[7px] text-[#f59e0b] font-semibold">4.9</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[6px] text-[#22c55e] font-medium">CEP Verificada</span>
              <span className="text-[6px] text-[#94a3b8]">1.2 km</span>
            </div>
          </div>
        </div>
        <div className={`rounded-xl py-2 text-center ${t(isDark, "bg-[#1e3a5f]", "bg-[#4a9d9a]")}`}>
          <span className="text-white text-[8px] font-semibold">Solicitar Servicio</span>
        </div>
      </motion.div>
    </div>
  );
}

/* Screen 5: Service request */
function PatientServiceRequestScreen({ isDark }: ScreenProps) {
  return (
    <div className={`flex-1 flex flex-col px-3.5 py-3 ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
      {/* Nurse mini card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-xl p-2 border flex items-center gap-2 mb-2.5 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center ring-1 ring-[#f59e0b]">
          <span className="text-white text-[6px] font-bold">MC</span>
        </div>
        <div className="flex-1">
          <p className={`text-[8px] font-semibold ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
            Maria C.
          </p>
          <div className="flex items-center gap-0.5">
            <StarIcon />
            <span className="text-[7px] text-[#f59e0b]">4.9</span>
          </div>
        </div>
      </motion.div>

      {/* Service selected */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-xl p-2.5 border-2 border-[#4a9d9a] bg-[#4a9d9a]/5 mb-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-[8px] font-semibold ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
              Inyeccion Intramuscular
            </p>
            <p className="text-[7px] text-[#64748b]">Duracion aprox: 30 min</p>
          </div>
          <span className="text-[11px] font-bold text-[#4a9d9a]">S/40</span>
        </div>
      </motion.div>

      {/* Location */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className={`rounded-xl p-2.5 border mb-2 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[6px] text-[#94a3b8]">Ubicacion</p>
            <p className={`text-[8px] font-medium ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
              Miraflores, Lima
            </p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 1.4, type: "spring" }}
            className="w-4 h-4 rounded-full bg-[#22c55e] flex items-center justify-center"
          >
            <span className="text-white text-[6px]">{"\u2713"}</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Date/time */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
        className={`rounded-xl p-2.5 border mb-3 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
      >
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[6px] text-[#94a3b8]">Fecha</p>
            <p className={`text-[8px] font-medium ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>Hoy</p>
          </div>
          <div className={`w-px h-5 ${t(isDark, "bg-[#e2e8f0]", "bg-[#334155]")}`} />
          <div>
            <p className="text-[6px] text-[#94a3b8]">Hora</p>
            <p className={`text-[8px] font-medium ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>14:00 - 16:00</p>
          </div>
        </div>
      </motion.div>

      <div className="flex-1" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        className={`rounded-xl py-2.5 text-center ${t(isDark, "bg-[#1e3a5f]", "bg-[#4a9d9a]")}`}
      >
        <span className="text-white text-[9px] font-semibold">Confirmar Solicitud</span>
      </motion.div>
    </div>
  );
}

/* Screen 6: Live tracking */
function PatientTrackingScreen({ isDark }: ScreenProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [eta, setEta] = useState(8);
  const steps = [
    { label: "Aceptado", color: "#22c55e" },
    { label: "En camino", color: "#f97316" },
    { label: "Llego", color: "#f59e0b" },
    { label: "En servicio", color: "#10b981" },
    { label: "Completado", color: "#22c55e" },
  ];

  useEffect(() => {
    const timers = [
      setTimeout(() => setActiveStep(1), 1200),
      setTimeout(() => setActiveStep(2), 2400),
      setTimeout(() => setActiveStep(3), 3400),
      setTimeout(() => setActiveStep(4), 4600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (activeStep >= 1) {
      const etaTimer = setInterval(() => {
        setEta((prev) => (prev > 1 ? prev - 1 : 1));
      }, 800);
      return () => clearInterval(etaTimer);
    }
  }, [activeStep]);

  return (
    <div className={`flex-1 flex flex-col ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
      {/* Mini map area */}
      <div className={`h-20 relative overflow-hidden ${t(isDark, "bg-[#e2e8f0]", "bg-[#1e293b]")}`}>
        {/* Dotted route line */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 80">
          <motion.path
            d="M 30 60 Q 80 20 120 40 Q 160 60 180 25"
            fill="none"
            stroke="#4a9d9a"
            strokeWidth="2"
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
          />
          {/* Start dot */}
          <circle cx="30" cy="60" r="4" fill="#4a9d9a" />
          {/* End dot */}
          <circle cx="180" cy="25" r="4" fill="#1e3a5f" />
          {/* Moving nurse dot */}
          <motion.circle
            cx="30"
            cy="60"
            r="5"
            fill="#f97316"
            initial={{ cx: 30, cy: 60 }}
            animate={{ cx: 120, cy: 40 }}
            transition={{ duration: 4, delay: 0.5, ease: "easeInOut" }}
          />
        </svg>

        {/* ETA badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0 }}
          className="absolute top-2 right-2 bg-[#1e3a5f] rounded-lg px-2 py-1 flex items-center gap-1 shadow-md"
        >
          <span className="text-[8px]">&#128337;</span>
          <span className="text-white text-[8px] font-bold">{eta} min</span>
        </motion.div>
      </div>

      {/* Status stepper */}
      <div className={`px-3.5 py-2.5 flex-1 ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
        <div className="pl-1 mb-2.5">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-start gap-2.5">
              <div className="flex flex-col items-center">
                <div className="relative">
                  {i === activeStep && (
                    <motion.div
                      animate={{ scale: [0, 2.5], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, ease: "easeOut", repeat: Infinity, repeatDelay: 0.3 }}
                      className="absolute inset-0 rounded-full"
                      style={{ background: s.color }}
                    />
                  )}
                  <div
                    className="relative w-4 h-4 rounded-full flex items-center justify-center transition-all duration-400"
                    style={{
                      background: i <= activeStep ? s.color : isDark ? "#334155" : "#e2e8f0",
                    }}
                  >
                    {i < activeStep ? (
                      <span className="text-white text-[6px] font-bold">{"\u2713"}</span>
                    ) : i === activeStep ? (
                      <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-white"
                      />
                    ) : (
                      <span className={`w-1 h-1 rounded-full ${isDark ? "bg-[#64748b]" : "bg-[#94a3b8]"}`} />
                    )}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="relative w-0.5 h-3.5">
                    <div className={`absolute inset-0 ${isDark ? "bg-[#334155]" : "bg-[#e2e8f0]"}`} />
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
              <div className="-mt-0.5 pb-0.5">
                <p
                  className={`text-[8px] font-semibold ${
                    i <= activeStep
                      ? t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")
                      : "text-[#94a3b8]"
                  }`}
                >
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Nurse card */}
        <div className={`rounded-xl p-2 flex items-center gap-2 border mb-2.5 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center ring-1 ring-[#f59e0b]">
            <span className="text-white text-[6px] font-bold">MC</span>
          </div>
          <div className="flex-1">
            <p className={`text-[8px] font-semibold ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
              Maria C.
            </p>
            <p className="text-[6px] text-[#4a9d9a]">Enfermera Certificada</p>
          </div>
          <div className="flex gap-1">
            <div className={`rounded-lg px-1.5 py-1 ${t(isDark, "bg-[#f1f5f9]", "bg-[#334155]")}`}>
              <span className="text-[7px]">&#128222;</span>
            </div>
            <div className={`rounded-lg px-1.5 py-1 ${t(isDark, "bg-[#f1f5f9]", "bg-[#334155]")}`}>
              <span className="text-[7px]">&#128172;</span>
            </div>
          </div>
        </div>

        {/* Security code */}
        <div className={`rounded-xl p-2 border text-center ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}>
          <p className="text-[6px] text-[#94a3b8] mb-1">Codigo de Seguridad</p>
          <div className="flex justify-center gap-1">
            {["4", "8", "2", "7", "1", "5"].map((digit, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.5 + i * 0.15 }}
                className={`w-5 h-6 rounded flex items-center justify-center text-[9px] font-bold border ${t(
                  isDark,
                  "bg-[#f8fafc] border-[#e2e8f0] text-[#1a1a2e]",
                  "bg-[#0f172a] border-[#334155] text-[#f1f5f9]"
                )}`}
              >
                {digit}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   NURSE SCREENS (continued) - Service Cycle
   ════════════════════════════════════════════════ */

/* Screen 7: Nurse accepts incoming request */
function NurseAcceptRequestScreen({ isDark }: ScreenProps) {
  const [countdown, setCountdown] = useState(45);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 30 ? prev - 1 : 30));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const acceptTimer = setTimeout(() => setAccepted(true), 3000);
    return () => clearTimeout(acceptTimer);
  }, []);

  return (
    <div className={`flex-1 flex flex-col ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#f97316] to-[#f59e0b] px-4 pt-2 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-white text-[9px] font-bold">Nueva Solicitud</span>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="bg-white/20 rounded-full px-2 py-0.5"
          >
            <span className="text-white text-[8px] font-mono font-bold">{countdown}s</span>
          </motion.div>
        </div>
      </div>

      <div className={`px-3.5 py-3 flex-1 flex flex-col ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
        {/* Patient info card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className={`rounded-xl p-3 border mb-3 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t(isDark, "bg-[#1e3a5f]/10", "bg-[#4a9d9a]/20")}`}>
              <span className={`text-[11px] font-bold ${t(isDark, "text-[#1e3a5f]", "text-[#4a9d9a]")}`}>AR</span>
            </div>
            <div className="flex-1">
              <p className={`text-[9px] font-semibold ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
                Ana Rodriguez
              </p>
              <p className="text-[7px] text-[#64748b]">Paciente verificada</p>
            </div>
          </div>

          {/* Service details */}
          {[
            { label: "Servicio", value: "Inyeccion Intramuscular", delay: 0.5 },
            { label: "Ubicacion", value: "Miraflores - 1.2 km", delay: 0.7 },
            { label: "Horario", value: "Hoy, 14:00 - 16:00", delay: 0.9 },
            { label: "Pago", value: "S/40 - Yape", delay: 1.1 },
          ].map((item) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: item.delay }}
              className={`flex items-center justify-between py-1 border-t ${t(isDark, "border-[#f1f5f9]", "border-[#334155]")}`}
            >
              <span className="text-[7px] text-[#94a3b8]">{item.label}</span>
              <span className={`text-[7px] font-medium ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
                {item.value}
              </span>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex-1" />

        {/* Action buttons */}
        <AnimatePresence mode="wait">
          {!accepted ? (
            <motion.div
              key="buttons"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: 1.5 }}
              className="flex gap-2"
            >
              <div className="flex-1 rounded-xl py-2.5 text-center bg-[#ef4444]/10 border border-[#ef4444]/20">
                <span className="text-[#ef4444] text-[9px] font-semibold">Rechazar</span>
              </div>
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className={`flex-1 rounded-xl py-2.5 text-center ${t(isDark, "bg-[#1e3a5f]", "bg-[#4a9d9a]")}`}
              >
                <span className="text-white text-[9px] font-semibold">Aceptar</span>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="accepted"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="rounded-xl py-3 text-center bg-[#22c55e]"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-white text-[10px] font-bold"
              >
                {"\u2713"} Solicitud Aceptada
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* Screen 8: Nurse completes service */
function NurseCompleteServiceScreen({ isDark }: ScreenProps) {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const serviceSteps = [
    { label: "En camino", sublabel: "Hacia el paciente" },
    { label: "Llego", sublabel: "En domicilio" },
    { label: "En servicio", sublabel: "Atencion en progreso" },
    { label: "Completado", sublabel: "Servicio finalizado" },
  ];

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 1600),
      setTimeout(() => setStep(3), 2400),
      setTimeout(() => setCompleted(true), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={`flex-1 flex flex-col ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
      {/* Header */}
      <div className="bg-[#0f172a] px-4 pt-2 pb-2.5">
        <div className="flex items-center justify-between">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-[8px]">&larr;</span>
          </div>
          <span className="text-white text-[9px] font-semibold">Servicio Activo</span>
          <div className="w-5 h-5" />
        </div>
      </div>

      <div className={`px-3.5 py-3 flex-1 flex flex-col ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
        {/* Patient card */}
        <div className={`rounded-xl p-2 flex items-center gap-2 border mb-3 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${t(isDark, "bg-[#1e3a5f]/10", "bg-[#4a9d9a]/20")}`}>
            <span className={`text-[7px] font-bold ${t(isDark, "text-[#1e3a5f]", "text-[#4a9d9a]")}`}>AR</span>
          </div>
          <div className="flex-1">
            <p className={`text-[8px] font-semibold ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>Ana R.</p>
            <p className="text-[6px] text-[#64748b]">Inyeccion IM - S/40</p>
          </div>
        </div>

        {/* Service stepper */}
        <div className="pl-1 mb-3">
          {serviceSteps.map((s, i) => {
            const isCompleted = i < step;
            const isActive = i === step;
            const color = i === 3 ? "#22c55e" : i === 2 ? "#10b981" : i === 1 ? "#f59e0b" : "#f97316";

            return (
              <div key={s.label} className="flex items-start gap-2.5">
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{
                      scale: isCompleted || isActive ? 1 : 0.8,
                      opacity: isCompleted || isActive ? 1 : 0.5,
                    }}
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background: isCompleted || isActive ? color : isDark ? "#334155" : "#e2e8f0",
                    }}
                  >
                    {isCompleted ? (
                      <span className="text-white text-[7px] font-bold">{"\u2713"}</span>
                    ) : isActive ? (
                      <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-white"
                      />
                    ) : (
                      <span className={`w-1 h-1 rounded-full ${isDark ? "bg-[#64748b]" : "bg-[#94a3b8]"}`} />
                    )}
                  </motion.div>
                  {i < serviceSteps.length - 1 && (
                    <div className="relative w-0.5 h-4">
                      <div className={`absolute inset-0 ${isDark ? "bg-[#334155]" : "bg-[#e2e8f0]"}`} />
                      {isCompleted && (
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 origin-top"
                          style={{ background: color }}
                        />
                      )}
                    </div>
                  )}
                </div>
                <div className="-mt-0.5 pb-1">
                  <p className={`text-[8px] font-semibold ${
                    isCompleted || isActive
                      ? t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")
                      : "text-[#94a3b8]"
                  }`}>
                    {s.label}
                  </p>
                  <p className="text-[6px] text-[#64748b]">{s.sublabel}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* Complete button / success */}
        <AnimatePresence mode="wait">
          {!completed ? (
            <motion.div
              key="btn"
              className={`rounded-xl py-2.5 text-center opacity-50 ${t(isDark, "bg-[#1e3a5f]", "bg-[#4a9d9a]")}`}
            >
              <span className="text-white text-[9px] font-semibold">Marcar como Completado</span>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="rounded-xl py-3 text-center bg-[#22c55e] relative overflow-hidden"
            >
              {/* Mini confetti particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 0, x: 0, opacity: 1 }}
                  animate={{
                    y: [0, -30 - Math.random() * 20],
                    x: [(i - 4) * 15, (i - 4) * 25 + (Math.random() - 0.5) * 20],
                    opacity: [1, 0],
                    rotate: [0, Math.random() * 360],
                  }}
                  transition={{ duration: 1, delay: 0.1 + i * 0.05 }}
                  className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full"
                  style={{
                    background: ["#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#f43f5e", "#4a9d9a", "#f97316", "#06b6d4"][i],
                  }}
                />
              ))}
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="text-white text-[10px] font-bold relative z-10"
              >
                {"\u2713"} Servicio Completado
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* Screen 9: Nurse receives review */
function NurseReceiveReviewScreen({ isDark }: ScreenProps) {
  const [starsShown, setStarsShown] = useState(0);
  const [showComment, setShowComment] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showTierUp, setShowTierUp] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStarsShown(1), 400),
      setTimeout(() => setStarsShown(2), 700),
      setTimeout(() => setStarsShown(3), 1000),
      setTimeout(() => setStarsShown(4), 1300),
      setTimeout(() => setStarsShown(5), 1600),
      setTimeout(() => setShowComment(true), 2200),
      setTimeout(() => setShowConfetti(true), 2800),
      setTimeout(() => setShowTierUp(true), 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={`flex-1 flex flex-col ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
      {/* Header */}
      <div className="bg-[#0f172a] px-4 pt-2 pb-2.5">
        <div className="flex items-center justify-between">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-[8px]">&larr;</span>
          </div>
          <span className="text-white text-[9px] font-semibold">Nueva Resena</span>
          <div className="w-5 h-5" />
        </div>
      </div>

      <div className={`px-3.5 py-3 flex-1 flex flex-col items-center relative overflow-hidden ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
        {/* Confetti layer */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  y: -10,
                  x: 30 + Math.random() * 180,
                  opacity: 1,
                  rotate: 0,
                }}
                animate={{
                  y: [0, 250 + Math.random() * 100],
                  x: 30 + Math.random() * 180 + (Math.random() - 0.5) * 60,
                  opacity: [1, 1, 0],
                  rotate: Math.random() * 720 - 360,
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: i * 0.06,
                  ease: "easeOut",
                }}
                className="absolute rounded-sm"
                style={{
                  width: `${3 + Math.random() * 4}px`,
                  height: `${3 + Math.random() * 4}px`,
                  background: ["#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#f43f5e", "#4a9d9a", "#f97316", "#06b6d4", "#ec4899", "#eab308"][i % 10],
                }}
              />
            ))}
          </div>
        )}

        {/* Patient avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${t(isDark, "bg-[#1e3a5f]/10", "bg-[#4a9d9a]/20")}`}
        >
          <span className={`text-sm font-bold ${t(isDark, "text-[#1e3a5f]", "text-[#4a9d9a]")}`}>AR</span>
        </motion.div>

        <p className={`text-[9px] font-semibold mb-0.5 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
          Ana Rodriguez
        </p>
        <p className="text-[7px] text-[#64748b] mb-3">Te dejo una resena</p>

        {/* Stars */}
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.div
              key={star}
              initial={{ scale: 0, rotate: -30 }}
              animate={
                star <= starsShown
                  ? { scale: [0, 1.4, 1], rotate: 0 }
                  : { scale: 0.6, rotate: 0 }
              }
              transition={{
                duration: 0.35,
                type: "spring",
                stiffness: 300,
              }}
            >
              <svg
                viewBox="0 0 20 20"
                fill={star <= starsShown ? "#f59e0b" : isDark ? "#334155" : "#e2e8f0"}
                className="w-6 h-6"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </motion.div>
          ))}
        </div>

        {starsShown >= 5 && (
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[#f59e0b] text-[11px] font-bold mb-3"
          >
            5.0 Excelente
          </motion.p>
        )}

        {/* Comment card */}
        {showComment && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`w-full rounded-xl p-2.5 border mb-3 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
          >
            <p className={`text-[8px] italic leading-relaxed ${t(isDark, "text-[#475569]", "text-[#94a3b8]")}`}>
              &ldquo;Excelente servicio, muy profesional y puntual. Maria fue muy amable y explico todo el procedimiento. 100% recomendada.&rdquo;
            </p>
          </motion.div>
        )}

        {/* Tier level up */}
        {showTierUp && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.1, 1], opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className={`w-full rounded-xl p-3 border-2 border-[#f59e0b]/40 text-center ${t(isDark, "bg-[#f59e0b]/5", "bg-[#f59e0b]/10")}`}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg mb-1"
            >
              &#127942;
            </motion.div>
            <p className={`text-[9px] font-bold mb-0.5 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
              Nivel Actualizado
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-[7px] text-[#94a3b8]">Certificada</span>
              <motion.span
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 0.6, repeat: 2 }}
                className="text-[#f59e0b] text-[8px]"
              >
                &rarr;
              </motion.span>
              <span className="text-[8px] font-bold text-[#f59e0b]">Destacada</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   PATIENT SCREENS (continued) - Review
   ════════════════════════════════════════════════ */

/* Screen 7: Patient leaves review */
function PatientReviewScreen({ isDark }: ScreenProps) {
  const [rating, setRating] = useState(0);
  const [showComment, setShowComment] = useState(false);
  const [showOptIn, setShowOptIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const comment = "Excelente servicio, muy profesional y puntual.";
  const { displayed: typedComment } = useTypingEffect(comment, 40, 2500, !submitted);

  useEffect(() => {
    const timers = [
      setTimeout(() => setRating(1), 400),
      setTimeout(() => setRating(2), 650),
      setTimeout(() => setRating(3), 900),
      setTimeout(() => setRating(4), 1150),
      setTimeout(() => setRating(5), 1400),
      setTimeout(() => setShowComment(true), 1800),
      setTimeout(() => setShowOptIn(true), 4500),
      setTimeout(() => setSubmitted(true), 5200),
      setTimeout(() => setShowConfetti(true), 5400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={`flex-1 flex flex-col ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
      {/* Header */}
      <div className="bg-[#0f172a] px-4 pt-2 pb-2.5">
        <div className="flex items-center justify-between">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-[8px]">&larr;</span>
          </div>
          <span className="text-white text-[9px] font-semibold">Calificar Servicio</span>
          <div className="w-5 h-5" />
        </div>
      </div>

      <div className={`px-3.5 py-3 flex-1 flex flex-col items-center relative overflow-hidden ${t(isDark, "bg-[#f8fafc]", "bg-[#0f172a]")}`}>
        {/* Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {[...Array(18)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  y: -10,
                  x: 20 + Math.random() * 200,
                  opacity: 1,
                  rotate: 0,
                }}
                animate={{
                  y: [0, 250 + Math.random() * 80],
                  x: 20 + Math.random() * 200 + (Math.random() - 0.5) * 50,
                  opacity: [1, 1, 0],
                  rotate: Math.random() * 720 - 360,
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: i * 0.05,
                  ease: "easeOut",
                }}
                className="absolute rounded-sm"
                style={{
                  width: `${3 + Math.random() * 4}px`,
                  height: `${3 + Math.random() * 4}px`,
                  background: ["#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#f43f5e", "#4a9d9a", "#f97316", "#06b6d4", "#ec4899", "#eab308"][i % 10],
                }}
              />
            ))}
          </div>
        )}

        {/* Nurse avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center ring-2 ring-[#f59e0b] mb-2 shadow-lg">
          <span className="text-white text-[10px] font-bold">MC</span>
        </div>
        <p className={`text-[9px] font-semibold mb-0.5 ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
          Maria C.
        </p>
        <p className="text-[7px] text-[#64748b] mb-3">Como fue tu experiencia?</p>

        {/* Stars */}
        <div className="flex items-center gap-1.5 mb-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.div
              key={star}
              initial={{ scale: 0.6 }}
              animate={
                star <= rating
                  ? { scale: [0.6, 1.4, 1], rotate: [0, -15, 15, 0] }
                  : { scale: 0.6 }
              }
              transition={{
                duration: 0.3,
                type: "spring",
                stiffness: 300,
              }}
            >
              <svg
                viewBox="0 0 20 20"
                fill={star <= rating ? "#f59e0b" : isDark ? "#334155" : "#e2e8f0"}
                className="w-7 h-7"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </motion.div>
          ))}
        </div>

        {rating >= 5 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[#f59e0b] text-[8px] font-semibold mb-3"
          >
            Excelente
          </motion.p>
        )}

        {/* Comment area */}
        {showComment && !submitted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full rounded-xl p-2.5 border mb-2 ${t(isDark, "bg-white border-[#e2e8f0]", "bg-[#1e293b] border-[#334155]")}`}
          >
            <p className="text-[6px] text-[#94a3b8] mb-1">Tu comentario</p>
            <p className={`text-[8px] min-h-[24px] leading-relaxed ${t(isDark, "text-[#1a1a2e]", "text-[#f1f5f9]")}`}>
              {typedComment}
              {typedComment.length < comment.length && (
                <span className="inline-block w-[1px] h-[10px] bg-[#4a9d9a] ml-[1px] align-middle animate-[blink_1s_step-end_infinite]" />
              )}
            </p>
          </motion.div>
        )}

        {/* Opt-in checkbox */}
        {showOptIn && !submitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 w-full mb-3"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              className="w-3.5 h-3.5 rounded border border-[#4a9d9a] bg-[#4a9d9a] flex items-center justify-center flex-shrink-0"
            >
              <span className="text-white text-[6px] font-bold">{"\u2713"}</span>
            </motion.div>
            <p className="text-[6px] text-[#94a3b8]">Permitir uso publico de mi resena</p>
          </motion.div>
        )}

        {/* Submit button / success */}
        <div className="flex-1" />
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: showOptIn ? 1 : 0.4 }}
              className={`w-full rounded-xl py-2.5 text-center ${t(isDark, "bg-[#1e3a5f]", "bg-[#4a9d9a]")}`}
            >
              <span className="text-white text-[9px] font-semibold">Enviar Resena</span>
            </motion.div>
          ) : (
            <motion.div
              key="thanks"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-full rounded-xl py-3 text-center bg-[#22c55e] relative z-10"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.15 }}
                className="text-white text-[10px] font-bold"
              >
                {"\u2713"} Gracias por tu resena
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   SCREEN REGISTRIES & FLOW CONFIG
   ════════════════════════════════════════════════ */

type FlowTab = "nurse" | "patient";

interface FlowConfig {
  screens: React.ComponentType<ScreenProps>[];
  durations: number[];
  timelineLabels: string[];
}

const flows: Record<FlowTab, FlowConfig> = {
  nurse: {
    screens: [
      NurseLandingScreen,
      NurseRegistrationScreen,
      CEPValidationScreen,
      CEPResultScreen,
      NurseSetupScreen,
      NurseDashboardReadyScreen,
      NurseAcceptRequestScreen,
      NurseCompleteServiceScreen,
      NurseReceiveReviewScreen,
    ],
    durations: [4000, 6000, 5000, 5000, 4500, 5000, 4500, 4500, 5500],
    timelineLabels: [
      "Elige tu rol",
      "Crea tu cuenta",
      "Valida tu CEP",
      "Confirma identidad",
      "Configura perfil",
      "Tu dashboard",
      "Acepta solicitud",
      "Completa servicio",
      "Recibe tu resena",
    ],
  },
  patient: {
    screens: [
      PatientLandingScreen,
      PatientRegistrationScreen,
      PatientHomeScreen,
      PatientMapScreen,
      PatientServiceRequestScreen,
      PatientTrackingScreen,
      PatientReviewScreen,
    ],
    durations: [4000, 5000, 4500, 5000, 4500, 6000, 6500],
    timelineLabels: [
      "Elige tu rol",
      "Crea tu cuenta",
      "Tu dashboard",
      "Busca enfermera",
      "Solicita servicio",
      "Seguimiento en vivo",
      "Deja tu resena",
    ],
  },
};

/* ════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════ */
export function OnboardingDemo() {
  const [activeTab, setActiveTab] = useState<FlowTab>("nurse");
  const [activeScreen, setActiveScreen] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const shouldReduceMotion = useReducedMotion();
  const phoneRef = useRef<HTMLDivElement>(null);

  const flow = flows[activeTab];
  const totalScreens = flow.screens.length;

  const handleTabChange = useCallback((tab: FlowTab) => {
    setActiveTab(tab);
    setActiveScreen(0);
    setFinished(false);
  }, []);

  const nextScreen = useCallback(() => {
    setActiveScreen((prev) => {
      if (prev >= totalScreens - 1) {
        setFinished(true);
        return prev;
      }
      return prev + 1;
    });
  }, [totalScreens]);

  useEffect(() => {
    if (isPaused || shouldReduceMotion || finished) return;
    const timer = setTimeout(nextScreen, flow.durations[activeScreen]);
    return () => clearTimeout(timer);
  }, [isPaused, nextScreen, activeScreen, shouldReduceMotion, finished, flow.durations]);

  // Reset on tab change
  useEffect(() => {
    setActiveScreen(0);
    setFinished(false);
  }, [activeTab]);

  const ActiveScreenComponent = flow.screens[activeScreen];

  return (
    <section
      id="demo"
      className="pt-12 pb-12 md:pt-16 md:pb-16 relative overflow-hidden"
      aria-labelledby="demo-title"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f8fafc] to-white dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a]" />
      <div className="absolute top-40 right-0 w-80 h-80 bg-[#4a9d9a]/8 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-72 h-72 bg-[#1e3a5f]/8 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a5f]/10 dark:bg-[#4a9d9a]/20 text-[#1e3a5f] dark:text-[#4a9d9a] rounded-full text-sm font-semibold mb-4">
            Tu experiencia paso a paso
          </span>
          <h2
            id="demo-title"
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a1a2e] dark:text-white mb-4"
          >
            Asi funciona{" "}
            <span className="gradient-text">NurseLite</span>
          </h2>
          <p className="text-lg text-[#64748b] dark:text-[#94a3b8] mb-8">
            Desde el registro hasta tu primer servicio, en minutos
          </p>

          {/* Tab selector */}
          <div className="inline-flex rounded-xl border border-[#e2e8f0] dark:border-[#334155] p-1 bg-white dark:bg-[#1e293b]">
            {(["nurse", "patient"] as FlowTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a] text-white shadow-md"
                    : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#1a1a2e] dark:hover:text-white"
                }`}
              >
                {tab === "nurse" ? "Enfermera" : "Paciente"}
              </button>
            ))}
          </div>
        </AnimatedSection>

        {/* Content: Timeline + Phone */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-12 items-start max-w-4xl mx-auto">
          {/* Timeline - Desktop */}
          <div className="hidden lg:block order-1">
            <div className="space-y-0.5 sticky top-28">
              {flow.timelineLabels.map((label, i) => {
                const isCompleted = i < activeScreen;
                const isActive = i === activeScreen;
                const isPending = i > activeScreen;

                return (
                  <button
                    key={`${activeTab}-${i}`}
                    onClick={() => {
                      setActiveScreen(i);
                      setFinished(i >= totalScreens - 1);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 text-left ${
                      isActive
                        ? "bg-white dark:bg-[#1e293b] shadow-sm"
                        : "hover:bg-white/50 dark:hover:bg-[#1e293b]/30"
                    }`}
                  >
                    {/* Step indicator */}
                    <div className="relative flex-shrink-0">
                      {isActive && (
                        <motion.div
                          animate={{ scale: [0, 1.8], opacity: [0.4, 0] }}
                          transition={{ duration: 1.5, ease: "easeOut", repeat: Infinity, repeatDelay: 0.3 }}
                          className="absolute inset-0 rounded-full bg-[#4a9d9a]"
                        />
                      )}
                      <div
                        className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isCompleted
                            ? "bg-[#22c55e]"
                            : isActive
                              ? "bg-[#4a9d9a]"
                              : isDark
                                ? "bg-[#334155]"
                                : "bg-[#e2e8f0]"
                        }`}
                      >
                        {isCompleted ? (
                          <span className="text-white text-xs font-bold">{"\u2713"}</span>
                        ) : (
                          <span
                            className={`text-xs font-bold ${
                              isActive ? "text-white" : isDark ? "text-[#64748b]" : "text-[#94a3b8]"
                            }`}
                          >
                            {i + 1}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Label */}
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium transition-colors duration-300 ${
                          isActive
                            ? "text-[#1a1a2e] dark:text-white font-semibold"
                            : isCompleted
                              ? "text-[#22c55e]"
                              : "text-[#94a3b8]"
                        }`}
                      >
                        {label}
                      </p>
                    </div>

                    {/* Progress bar for active step */}
                    {isActive && !isPaused && !finished && (
                      <motion.div
                        key={`progress-${activeTab}-${activeScreen}`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{
                          duration: flow.durations[i] / 1000,
                          ease: "linear",
                        }}
                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full origin-left bg-[#4a9d9a]"
                      />
                    )}
                  </button>
                );
              })}

              {/* Replay button */}
              {finished && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    setActiveScreen(0);
                    setFinished(false);
                  }}
                  className="w-full mt-3 py-2.5 rounded-xl border border-[#4a9d9a] text-[#4a9d9a] text-sm font-semibold hover:bg-[#4a9d9a]/10 transition-colors"
                >
                  Repetir demo
                </motion.button>
              )}
            </div>
          </div>

          {/* Phone + dots */}
          <AnimatedSection direction="right" className="order-2 flex flex-col items-center">
            <div
              ref={phoneRef}
              className="relative w-[300px]"
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
                        key={`${activeTab}-${activeScreen}`}
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
                </div>

                {/* Dynamic island */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full" />
              </div>
            </div>

            {/* Mobile: dots + label */}
            <div className="mt-5">
              <div className="flex items-center justify-center gap-1.5">
                {flow.timelineLabels.map((label, i) => (
                  <button
                    key={`dot-${activeTab}-${i}`}
                    onClick={() => {
                      setActiveScreen(i);
                      setFinished(i >= totalScreens - 1);
                    }}
                    aria-label={`Paso ${i + 1}: ${label}`}
                    className={`transition-all duration-300 rounded-full ${
                      i === activeScreen
                        ? "w-6 h-2 bg-[#4a9d9a]"
                        : i < activeScreen
                          ? "w-2 h-2 bg-[#22c55e]"
                          : "w-2 h-2 bg-[#94a3b8] hover:bg-[#64748b]"
                    }`}
                  />
                ))}
              </div>
              <p className="text-center text-xs text-[#94a3b8] dark:text-[#64748b] mt-2 font-medium">
                {flow.timelineLabels[activeScreen]}
              </p>

              {/* Mobile replay */}
              {finished && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => {
                    setActiveScreen(0);
                    setFinished(false);
                  }}
                  className="mt-3 mx-auto block px-4 py-2 rounded-xl border border-[#4a9d9a] text-[#4a9d9a] text-xs font-semibold hover:bg-[#4a9d9a]/10 transition-colors lg:hidden"
                >
                  Repetir demo
                </motion.button>
              )}
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
