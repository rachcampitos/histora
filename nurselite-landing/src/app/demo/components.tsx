"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTypingEffect } from "./hooks";
import Image from "next/image";

/* ── iOS Status Bar ── */
export function StatusBar() {
  return (
    <div className="h-[88px] bg-white flex items-end justify-between px-10 pb-4 shrink-0">
      <span className="text-[32px] font-semibold text-[#1a1a2e]">9:41</span>
      <div className="flex items-center gap-3">
        <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
          <rect width="8" height="12" rx="1.5" x="2" y="10" fill="#1a1a2e" opacity="0.3" />
          <rect width="8" height="16" rx="1.5" x="12" y="6" fill="#1a1a2e" opacity="0.5" />
          <rect width="8" height="20" rx="1.5" x="22" y="2" fill="#1a1a2e" opacity="0.7" />
          <rect width="8" height="24" rx="1.5" x="32" y="0" fill="#1a1a2e" />
        </svg>
        <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
          <path
            d="M16 6C19.5 6 22.6 7.6 24.8 10.2L26.4 8.6C23.7 5.5 20.1 3.6 16 3.6C11.9 3.6 8.3 5.5 5.6 8.6L7.2 10.2C9.4 7.6 12.5 6 16 6Z"
            fill="#1a1a2e"
          />
          <path
            d="M16 11C18.2 11 20.2 11.9 21.6 13.4L23.2 11.8C21.3 9.8 18.8 8.6 16 8.6C13.2 8.6 10.7 9.8 8.8 11.8L10.4 13.4C11.8 11.9 13.8 11 16 11Z"
            fill="#1a1a2e"
          />
          <circle cx="16" cy="18" r="3" fill="#1a1a2e" />
        </svg>
        <svg width="50" height="24" viewBox="0 0 50 24" fill="none">
          <rect x="2" y="4" width="38" height="16" rx="3" stroke="#1a1a2e" strokeWidth="2" fill="none" />
          <rect x="42" y="9" width="5" height="6" rx="1.5" fill="#1a1a2e" />
          <rect x="5" y="7" width="30" height="10" rx="1.5" fill="#1a1a2e" />
        </svg>
      </div>
    </div>
  );
}

/* ── Toolbar ── */
export function Toolbar({ title }: { title: string }) {
  return (
    <div className="h-[110px] bg-[#1e3a5f] flex items-center justify-center px-10 shrink-0 relative">
      <span className="absolute left-8 text-white text-[48px] leading-none">
        &#8249;
      </span>
      <span className="text-white text-[36px] font-bold">{title}</span>
    </div>
  );
}

/* ── Demo Shell ── */
export function DemoShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-full flex flex-col bg-[#f8fafc]">
      <StatusBar />
      <Toolbar title={title} />
      <div className="flex-1 overflow-y-auto px-8 py-8">{children}</div>
    </div>
  );
}

/* ── Full Screen Step ── */
export function FullScreen({ children, className = "bg-white" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center ${className}`}>
      {children}
    </div>
  );
}

/* ── Avatar ── */
export function Avatar({
  initials,
  size = "md",
  ring,
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
  ring?: string;
}) {
  const sizes = {
    sm: "w-[64px] h-[64px] text-[26px]",
    md: "w-[100px] h-[100px] text-[42px]",
    lg: "w-[140px] h-[140px] text-[56px]",
  };
  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a] text-white flex items-center justify-center font-bold shrink-0 ${ring || ""}`}
    >
      {initials}
    </div>
  );
}

/* ── Star Rating ── */
export function StarRating({
  count = 5,
  active,
  staggerDelay = 200,
}: {
  count?: number;
  active: boolean;
  staggerDelay?: number;
}) {
  return (
    <div className="flex gap-5 justify-center my-8">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={
            active
              ? { scale: 1, opacity: 1 }
              : { scale: 0, opacity: 0 }
          }
          transition={{
            delay: active ? 0.3 + i * (staggerDelay / 1000) : 0,
            duration: 0.4,
            type: "spring",
            stiffness: 300,
            damping: 15,
          }}
          className="text-[80px] leading-none"
        >
          ⭐
        </motion.div>
      ))}
    </div>
  );
}

/* ── Stepper ── */
export function Stepper({
  steps,
  activeIndex,
}: {
  steps: string[];
  activeIndex: number;
}) {
  return (
    <div className="bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6 mb-6">
      {steps.map((label, i) => {
        const completed = i < activeIndex;
        const isActive = i === activeIndex;
        return (
          <div key={i} className="flex items-center gap-5 mb-7 last:mb-0 relative">
            {i < steps.length - 1 && (
              <div
                className={`absolute left-6 top-14 bottom-[-28px] w-[3px] ${
                  completed || isActive ? "bg-[#4a9d9a]" : "bg-[#e2e8f0]"
                }`}
              />
            )}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-[24px] font-bold shrink-0 relative z-10 transition-all duration-300 ${
                completed || isActive
                  ? "bg-[#4a9d9a] text-white"
                  : "bg-[#e2e8f0] text-[#94a3b8]"
              }`}
            >
              {completed ? "✓" : i + 1}
            </div>
            <span
              className={`text-[26px] font-semibold transition-colors duration-300 ${
                completed || isActive ? "text-[#1a1a2e]" : "text-[#64748b]"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Security Code ── */
export function SecurityCode({
  digits,
  active,
}: {
  digits: string[];
  active: boolean;
}) {
  return (
    <div className="flex gap-4 justify-center my-8">
      {digits.map((digit, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={
            active
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.5 }
          }
          transition={{
            delay: active ? 0.5 + i * 0.4 : 0,
            duration: 0.3,
            type: "spring",
            stiffness: 400,
            damping: 20,
          }}
          className="w-[80px] h-[100px] bg-white border-2 border-[#4a9d9a] rounded-xl flex items-center justify-center text-[48px] font-extrabold text-[#1e3a5f]"
        >
          {digit}
        </motion.div>
      ))}
    </div>
  );
}

/* ── Confetti ── */
export function Confetti({ active, count = 40 }: { active: boolean; count?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const particles = useMemo(() => {
    if (!mounted) return [];
    const colors = ["#f59e0b", "#22c55e", "#3b82f6", "#f43f5e", "#8b5cf6", "#4a9d9a"];
    return Array.from({ length: count }).map(() => ({
      x: Math.random() * window.innerWidth,
      targetY: window.innerHeight + 50,
      duration: 1.5 + Math.random(),
      delay: Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, [mounted, count]);

  if (!active || !mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: p.x, y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: p.targetY, rotate: 720, opacity: 0 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          className="absolute w-[10px] h-[10px] rounded-sm"
          style={{ background: p.color }}
        />
      ))}
    </div>
  );
}

/* ── Typing Field ── */
export function TypingField({
  label,
  value,
  speed = 50,
  startDelay = 0,
  active,
  icon,
}: {
  label: string;
  value: string;
  speed?: number;
  startDelay?: number;
  active: boolean;
  icon?: React.ReactNode;
}) {
  const { displayed, done } = useTypingEffect(value, speed, startDelay, active);
  const showCursor = active && displayed.length > 0 && !done;

  return (
    <div className="mb-5">
      <label className="block text-[20px] font-medium text-[#475569] mb-2 ml-1">
        {label}
      </label>
      <div className="border-2 border-transparent rounded-[12px] px-4 bg-[#f8fafc] h-[48px] flex items-center transition-colors"
        style={{ borderColor: displayed ? '#1e3a5f' : 'transparent' }}>
        {icon && <span className="mr-3 text-[20px] text-[#94a3b8] shrink-0">{icon}</span>}
        <span className="text-[22px] text-[#1e293b]">
          {displayed}
        </span>
        {showCursor && (
          <span className="inline-block w-[2px] h-[24px] bg-[#1e3a5f] ml-1 animate-pulse" />
        )}
        {!displayed && (
          <span className="text-[22px] text-[#a0aec0]">{label}...</span>
        )}
      </div>
    </div>
  );
}

/* ── Gradient Header ── */
export function GradientHeader({
  subtitle,
  title,
  children,
}: {
  subtitle: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a] text-white px-8 pt-8 pb-10 rounded-b-[32px] -mx-8 -mt-8 mb-8">
      <p className="text-[22px] opacity-90 mb-2">{subtitle}</p>
      <p className="text-[48px] font-extrabold">{title}</p>
      {children}
    </div>
  );
}

/* ── Card ── */
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-[16px] border border-[#f1f5f9] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6 mb-6 ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Toggle ── */
export function Toggle({ on }: { on: boolean }) {
  return (
    <div
      className={`w-[80px] h-[44px] rounded-full relative transition-colors duration-300 ${
        on ? "bg-[#22c55e]" : "bg-[#d1d5db]"
      }`}
    >
      <div
        className={`w-[36px] h-[36px] rounded-full bg-white shadow-md absolute top-1 transition-all duration-300 ${
          on ? "left-[40px]" : "left-1"
        }`}
      />
    </div>
  );
}

/* ── Logo Intro ── */
export function LogoIntro({ subtitle }: { subtitle: string }) {
  return (
    <FullScreen className="bg-[#0f172a]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <Image
          src="/nurselite.png"
          alt="NurseLite"
          width={250}
          height={250}
          className="mb-8 rounded-[32px]"
          priority
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-[48px] font-bold"
        >
          <span className="text-white">Nurse</span>
          <span className="text-[#4a9d9a]">Lite</span>
        </motion.p>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="text-[36px] font-semibold text-white/90 mt-6"
      >
        Enfermeria a domicilio
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="text-[28px] text-white/50 mt-4"
      >
        {subtitle}
      </motion.p>
    </FullScreen>
  );
}

/* ── Role Landing (App Landing Page) ── */
export function RoleLanding({
  activeRole,
  active,
}: {
  activeRole: "patient" | "nurse";
  active: boolean;
}) {
  const isPatient = activeRole === "patient";

  const features = isPatient
    ? [
        { icon: "🛡️", text: "Colegiatura verificada en CEP" },
        { icon: "📍", text: "Seguimiento GPS en tiempo real" },
        { icon: "🔒", text: "Codigo de seguridad por servicio" },
      ]
    : [
        { icon: "💰", text: "100% de tus ganancias" },
        { icon: "📅", text: "Trabaja con tu propio horario" },
        { icon: "📈", text: "Crece como profesional" },
      ];

  return (
    <div className="w-full h-full flex flex-col bg-[#f8fafc]">
      <StatusBar />
      <div className="flex-1 flex flex-col items-center px-10 pt-[4vh]">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={active ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4 mb-8"
        >
          <Image
            src="/nurselite.png"
            alt="NurseLite"
            width={110}
            height={110}
            className="rounded-2xl shadow-lg"
          />
          <span className="text-[38px] font-bold text-[#1e3a5f]">NurseLite</span>
        </motion.div>

        {/* Tab Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={active ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex gap-3 p-2 bg-black/[0.08] rounded-full mb-8"
        >
          <div
            className={`flex items-center gap-4 px-8 py-5 rounded-full text-[28px] font-medium transition-all ${
              isPatient
                ? "bg-gradient-to-r from-[#4a9d9a] to-[#5fb3b0] text-white shadow-lg"
                : "bg-white/70 text-[#64748b]"
            }`}
          >
            <span className="text-[30px]">🔍</span>
            <span>Busco Enfermera</span>
          </div>
          <div
            className={`flex items-center gap-4 px-8 py-5 rounded-full text-[28px] font-medium transition-all ${
              !isPatient
                ? "bg-gradient-to-r from-[#15803d] to-[#16a34a] text-white shadow-lg"
                : "bg-white/70 text-[#64748b]"
            }`}
          >
            <span className="text-[30px]">🩺</span>
            <span>Soy Enfermera</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-center mb-8 max-w-[520px]"
        >
          <h1 className="text-[36px] font-bold text-[#1a1a2e] leading-tight mb-3">
            {isPatient
              ? "Atencion profesional en la puerta de tu casa"
              : "Gana mas, trabaja cuando quieras"}
          </h1>
          <p className="text-[26px] text-[#64748b]">
            {isPatient
              ? "Enfermeras verificadas por el CEP"
              : "Tu profesion, tu horario, tus reglas"}
          </p>
        </motion.div>

        {/* Features */}
        <div className="w-full max-w-[500px] mb-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={active ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.7 + i * 0.1, duration: 0.3 }}
              className={`flex items-center gap-5 px-7 py-5 rounded-[12px] mb-3 ${
                isPatient ? "bg-[#1e3a5f]/[0.05]" : "bg-[#16a34a]/[0.08]"
              }`}
            >
              <span className="text-[34px]">{f.icon}</span>
              <span className="text-[28px] font-medium text-[#1a1a2e]">{f.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : {}}
          transition={{ delay: 1, duration: 0.4 }}
          className="flex flex-col items-center gap-2 mb-10"
        >
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="text-[24px]">⭐</span>
            ))}
          </div>
          <span className="text-[20px] text-[#94a3b8]">
            {isPatient ? "Enfermeras verificadas en Lima" : "Profesionales activos en la plataforma"}
          </span>
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={active ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.1, duration: 0.4 }}
          className={`w-full max-w-[460px] h-[76px] text-white text-[30px] font-semibold rounded-[12px] shadow-[0_4px_16px_rgba(30,58,95,0.3)] ${
            isPatient
              ? "bg-[#1e3a5f]"
              : "bg-gradient-to-r from-[#15803d] to-[#16a34a]"
          }`}
        >
          {isPatient ? "Encontrar enfermera cerca" : "Empezar a ganar hoy"}
        </motion.button>

        {/* Login link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : {}}
          transition={{ delay: 1.3, duration: 0.3 }}
          className="text-[24px] text-[#64748b] mt-6"
        >
          ¿Ya tienes cuenta? <span className="text-[#1e3a5f] font-semibold underline">Inicia sesion</span>
        </motion.p>
      </div>
    </div>
  );
}

/* ── Stepper Icons (match Ionicons: checkmark-circle, navigate, location, medical, checkmark-done) ── */
function StepStatusIcon({ status }: { status: string }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (status) {
    case "accepted":
      return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-5" /></svg>;
    case "on_the_way":
      return <svg {...common}><polygon points="3 11 22 2 13 21 11 13 3 11" fill="currentColor" stroke="none" /></svg>;
    case "arrived":
      return <svg {...common}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>;
    case "in_progress":
      return <svg {...common}><path d="M12 4v16M4 12h16" strokeWidth={3} /></svg>;
    case "completed":
      return <svg {...common}><path d="M18 7L9.5 17 6 13" /><path d="M22 7L13.5 17" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="3" /></svg>;
  }
}

/* Checkmark icon for completed steps (replaces status icon) */
function CheckmarkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/* ── Horizontal Stepper (Tracking) ── */
/* Replicates real app: steps always equidistant (flex:1 0 0), only lines compress when completed */
const TRACKING_COLORS: Record<string, string> = {
  accepted: "#2563eb",
  on_the_way: "#ea580c",
  arrived: "#d97706",
  in_progress: "#0891b2",
  completed: "#16a34a",
};

export function HorizontalStepper({
  steps,
  activeIndex,
}: {
  steps: { label: string; status: string }[];
  activeIndex: number;
}) {
  // Build alternating [step, line, step, line, ..., step] items
  const items: React.ReactNode[] = [];

  steps.forEach((step, i) => {
    const completed = i < activeIndex;
    const isActive = i === activeIndex;
    const color = TRACKING_COLORS[step.status] || "#94a3b8";

    // ── Step item (always flex: 1 0 0 → equidistant) ──
    items.push(
      <div
        key={`s${i}`}
        className="flex flex-col items-center"
        style={{
          flex: "1 0 0",
          minWidth: 0,
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Dot */}
        <div className="relative">
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center"
            style={{
              background: completed || isActive ? color : "#e0e0e0",
              color: completed || isActive ? "#fff" : "#999",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {completed ? <CheckmarkIcon /> : <StepStatusIcon status={step.status} />}
          </div>
          {/* Pulse ring on active dot */}
          {isActive && (
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 0 4px ${color}33`,
                  `0 0 0 8px ${color}1a`,
                  `0 0 0 4px ${color}33`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full"
            />
          )}
        </div>
        {/* Label (visible) or label-dot (completed) */}
        {completed ? (
          <div
            className="mt-[6px] w-[8px] h-[8px] rounded-full"
            style={{
              background: color,
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        ) : (
          <span
            className="mt-[6px] text-center leading-tight whitespace-nowrap"
            style={{
              fontSize: "12px",
              fontWeight: isActive ? 600 : 400,
              color: isActive ? color : "#999",
              maxWidth: "70px",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {step.label}
          </span>
        )}
      </div>
    );

    // ── Line between step[i] and step[i+1] ──
    if (i < steps.length - 1) {
      const lineCompleted = i < activeIndex;
      const lineActive = i === activeIndex;
      const lineColor = TRACKING_COLORS[step.status] || "#94a3b8";

      items.push(
        <div
          key={`l${i}`}
          className="relative overflow-hidden rounded-sm self-start"
          style={{
            height: "3px",
            marginTop: "15px", // centers with 32px dot
            marginLeft: "4px",
            marginRight: "4px",
            flex: lineCompleted ? "0 0 16px" : "1 1 auto",
            minWidth: lineActive ? "80px" : lineCompleted ? "16px" : "20px",
            background: lineCompleted ? lineColor : "#e0e0e0",
            borderRadius: "2px",
            transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Shimmer sweep on active line (matches fillLine keyframes from real app) */}
          {lineActive && (
            <motion.div
              animate={{ x: ["-100%", "100%"], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${lineColor} 50%, transparent 100%)`,
                width: "100%",
              }}
            />
          )}
        </div>
      );
    }
  });

  return (
    <div className="bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] px-3 pt-4 pb-5 mb-5">
      <div className="flex items-start">
        {items}
      </div>
    </div>
  );
}

/* ── Interstitial Screen (chapter divider for TikTok demos) ── */
export function InterstitialScreen({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  text: string;
}) {
  return (
    <FullScreen className="bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        className="mb-8"
      >
        <Icon size={72} className="text-[#4a9d9a]" strokeWidth={2} />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-[40px] font-bold text-white text-center leading-tight px-12"
      >
        {text}
      </motion.h2>
    </FullScreen>
  );
}

/* ── Final Screen ── */
export function FinalScreen({ tagline }: { tagline: string }) {
  return (
    <FullScreen className="bg-[#0f172a]">
      <Image
        src="/nurselite.png"
        alt="NurseLite"
        width={300}
        height={300}
        className="mb-8 rounded-[36px]"
      />
      <p className="text-[52px] font-bold mb-8">
        <span className="text-white">Nurse</span>
        <span className="text-[#4a9d9a]">Lite</span>
      </p>
      <p className="text-[36px] font-semibold text-white/90 mb-6 text-center px-20">
        {tagline}
      </p>
      <p className="text-[28px] font-bold text-[#4a9d9a] text-center">
        Disponible en app.nurse-lite.com
      </p>
    </FullScreen>
  );
}
