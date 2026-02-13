"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useStepEngine,
  type DemoStep,
} from "../hooks";
import {
  LogoIntro,
  FinalScreen,
  TikTokDemo,
} from "../components";

/* ── SVG Star path ── */
const STAR_PATH = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";
const CONFETTI_COLORS = ["#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#f43f5e", "#4a9d9a", "#f97316", "#06b6d4", "#ec4899", "#eab308"];

const steps: DemoStep[] = [
  { id: "intro", duration: 3000, isFullScreen: true, caption: { title: "Cada paciente que cuidas merece ser contado", subtitle: "NurseLite convierte tu dedicacion en reconocimiento" } },
  { id: "dashboard", duration: 5000, caption: { title: "Tu panel profesional" } },
  { id: "solicitud", duration: 5000, caption: { title: "Recibe solicitudes en tiempo real" } },
  { id: "completado", duration: 5000, caption: { title: "Servicio completado" } },
  { id: "resena", duration: 6000, caption: { title: "Recibe calificaciones y sube de nivel" } },
  { id: "final", duration: null, isFullScreen: true },
];

export default function DemoEnfermera() {
  const { currentStep, step } = useStepEngine(steps);
  const active = (id: string) => step.id === id;

  const renderContent = () => {
    if (active("intro")) return <LogoIntro subtitle="Para profesionales de enfermeria" />;
    if (active("final")) return <FinalScreen tagline="Gana dinero con tu profesion" />;
    if (active("dashboard")) return <DashboardScreen />;
    if (active("solicitud")) return <SolicitudScreen />;
    if (active("completado")) return <CompletadoScreen />;
    if (active("resena")) return <ResenaScreen />;
    return null;
  };

  return (
    <TikTokDemo steps={steps} currentStep={currentStep}>
      {renderContent()}
    </TikTokDemo>
  );
}

/* ════════════════════════════════════════════════
   SCREEN 1: Dashboard (based on NurseDashboardReadyScreen)
   ════════════════════════════════════════════════ */
function DashboardScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-[#f8fafc]">
      {/* Gradient header */}
      <div className="bg-gradient-to-b from-[#1e3a5f] to-[#4a9d9a] px-8 pt-[44px] pb-8 shrink-0">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <p className="text-white/60 text-[22px]">Panel Profesional</p>
            <p className="text-white font-bold text-[36px]">Hola, Maria</p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex items-center gap-3 bg-white/15 rounded-full px-5 py-3 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2, type: "spring" }}
              className="w-[12px] h-[12px] rounded-full bg-[#22c55e]"
            />
            <span className="text-white text-[20px] font-medium">Disponible</span>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <div className="flex gap-4">
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
              className="flex-1 bg-white/15 rounded-[16px] p-5 text-center backdrop-blur-sm"
            >
              <p className="text-white text-[28px] font-bold">{s.val}</p>
              <p className="text-white/60 text-[18px]">{s.lbl}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-7 py-6">
        <p className="text-[26px] font-semibold text-[#1a1a2e] mb-5">Solicitud Cercana</p>

        {/* Shimmer loading card */}
        <motion.div className="rounded-[16px] p-6 border overflow-hidden relative bg-white border-[#e2e8f0] mb-6">
          <div className="flex items-center gap-5 mb-4 relative z-10">
            <div className="w-[60px] h-[60px] rounded-full bg-[#e2e8f0]" />
            <div className="flex-1 space-y-2">
              <div className="h-[12px] rounded w-[140px] bg-[#e2e8f0]" />
              <div className="h-[10px] rounded w-[200px] bg-[#f1f5f9]" />
            </div>
          </div>
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
        </motion.div>

        <p className="text-[26px] font-semibold text-[#1a1a2e] mb-4">Acciones Rapidas</p>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-4">
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
              className="rounded-[16px] p-4 text-center border bg-white border-[#e2e8f0]"
            >
              <div
                className="w-[36px] h-[36px] rounded-[10px] mx-auto mb-2 flex items-center justify-center"
                style={{ background: `${a.color}15` }}
              >
                <div className="w-[18px] h-[18px] rounded" style={{ background: a.color }} />
              </div>
              <p className="text-[18px] font-medium text-[#1a1a2e]">{a.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   SCREEN 2: Solicitud (based on NurseAcceptRequestScreen)
   ════════════════════════════════════════════════ */
function SolicitudScreen() {
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
    <div className="w-full h-full flex flex-col bg-[#f8fafc]">
      {/* Orange header */}
      <div className="bg-gradient-to-r from-[#f97316] to-[#f59e0b] px-8 pt-[44px] pb-5 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-white text-[26px] font-bold">Nueva Solicitud</span>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="bg-white/20 rounded-full px-5 py-2"
          >
            <span className="text-white text-[24px] font-mono font-bold">{countdown}s</span>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 px-8 py-6 flex flex-col">
        {/* Patient info card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-[16px] p-6 border bg-white border-[#e2e8f0] mb-6"
        >
          <div className="flex items-center gap-5 mb-5">
            <div className="w-[72px] h-[72px] rounded-full bg-[#1e3a5f]/10 flex items-center justify-center">
              <span className="text-[30px] font-bold text-[#1e3a5f]">AR</span>
            </div>
            <div className="flex-1">
              <p className="text-[26px] font-semibold text-[#1a1a2e]">Ana Rodriguez</p>
              <p className="text-[20px] text-[#64748b]">Paciente verificada</p>
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
              className="flex items-center justify-between py-3 border-t border-[#f1f5f9]"
            >
              <span className="text-[20px] text-[#94a3b8]">{item.label}</span>
              <span className="text-[20px] font-medium text-[#1a1a2e]">{item.value}</span>
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
              className="flex gap-4"
            >
              <div className="flex-1 rounded-[16px] py-5 flex items-center justify-center bg-[#ef4444]/10 border border-[#ef4444]/20">
                <span className="text-[#ef4444] text-[24px] font-semibold">Rechazar</span>
              </div>
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="flex-1 rounded-[16px] py-5 flex items-center justify-center bg-[#1e3a5f]"
              >
                <span className="text-white text-[24px] font-semibold">Aceptar</span>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="accepted"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="rounded-[16px] py-6 flex items-center justify-center bg-[#22c55e]"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-white text-[26px] font-bold"
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

/* ════════════════════════════════════════════════
   SCREEN 3: Completado (based on NurseCompleteServiceScreen)
   ════════════════════════════════════════════════ */
function CompletadoScreen() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  const serviceSteps = [
    { label: "En camino", sublabel: "Hacia el paciente", color: "#f97316" },
    { label: "Llego", sublabel: "En domicilio", color: "#f59e0b" },
    { label: "En servicio", sublabel: "Atencion en progreso", color: "#10b981" },
    { label: "Completado", sublabel: "Servicio finalizado", color: "#22c55e" },
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
    <div className="w-full h-full flex flex-col bg-[#f8fafc]">
      {/* Dark header */}
      <div className="bg-[#0f172a] px-8 pt-[44px] pb-5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="w-[36px] h-[36px] rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-[22px] leading-none">&#8249;</span>
          </div>
          <span className="text-white text-[26px] font-semibold">Servicio Activo</span>
          <div className="w-[36px]" />
        </div>
      </div>

      <div className="flex-1 px-8 py-6 flex flex-col">
        {/* Patient card */}
        <div className="rounded-[16px] p-5 flex items-center gap-5 border bg-white border-[#e2e8f0] mb-6">
          <div className="w-[52px] h-[52px] rounded-full bg-[#1e3a5f]/10 flex items-center justify-center">
            <span className="text-[22px] font-bold text-[#1e3a5f]">AR</span>
          </div>
          <div className="flex-1">
            <p className="text-[24px] font-semibold text-[#1a1a2e]">Ana R.</p>
            <p className="text-[18px] text-[#64748b]">Inyeccion IM - S/40</p>
          </div>
        </div>

        {/* Vertical service stepper */}
        <div className="pl-3 mb-6">
          {serviceSteps.map((s, i) => {
            const isCompleted = i < step;
            const isActive = i === step;

            return (
              <div key={s.label} className="flex items-start gap-6">
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{
                      scale: isCompleted || isActive ? 1 : 0.8,
                      opacity: isCompleted || isActive ? 1 : 0.5,
                    }}
                    className="w-[36px] h-[36px] rounded-full flex items-center justify-center"
                    style={{
                      background: isCompleted || isActive ? s.color : "#e2e8f0",
                    }}
                  >
                    {isCompleted ? (
                      <span className="text-white text-[18px] font-bold">{"\u2713"}</span>
                    ) : isActive ? (
                      <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="w-[10px] h-[10px] rounded-full bg-white"
                      />
                    ) : (
                      <span className="w-[8px] h-[8px] rounded-full bg-[#94a3b8]" />
                    )}
                  </motion.div>
                  {i < serviceSteps.length - 1 && (
                    <div className="relative w-[4px] h-[36px]">
                      <div className="absolute inset-0 bg-[#e2e8f0]" />
                      {isCompleted && (
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
                <div className="-mt-1 pb-3">
                  <p className={`text-[24px] font-semibold ${
                    isCompleted || isActive ? "text-[#1a1a2e]" : "text-[#94a3b8]"
                  }`}>
                    {s.label}
                  </p>
                  <p className="text-[18px] text-[#64748b]">{s.sublabel}</p>
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
              className="rounded-[16px] py-5 flex items-center justify-center opacity-50 bg-[#1e3a5f]"
            >
              <span className="text-white text-[24px] font-semibold">Marcar como Completado</span>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="rounded-[16px] py-6 flex items-center justify-center bg-[#22c55e] relative overflow-hidden"
            >
              {/* Mini confetti */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 0, x: 0, opacity: 1 }}
                  animate={{
                    y: [0, -40 - Math.random() * 30],
                    x: [(i - 4) * 20, (i - 4) * 35 + (Math.random() - 0.5) * 30],
                    opacity: [1, 0],
                    rotate: [0, Math.random() * 360],
                  }}
                  transition={{ duration: 1, delay: 0.1 + i * 0.05 }}
                  className="absolute top-1/2 left-1/2 w-[8px] h-[8px] rounded-full"
                  style={{
                    background: CONFETTI_COLORS[i % 8],
                  }}
                />
              ))}
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="text-white text-[26px] font-bold relative z-10"
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

/* ════════════════════════════════════════════════
   SCREEN 4: Resena (based on NurseReceiveReviewScreen)
   ════════════════════════════════════════════════ */
function ResenaScreen() {
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
    <div className="w-full h-full flex flex-col bg-[#f8fafc]">
      {/* Dark header */}
      <div className="bg-[#0f172a] px-8 pt-[44px] pb-5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="w-[36px] h-[36px] rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-[22px] leading-none">&#8249;</span>
          </div>
          <span className="text-white text-[26px] font-semibold">Nueva Resena</span>
          <div className="w-[36px]" />
        </div>
      </div>

      <div className="flex-1 px-8 py-6 flex flex-col items-center relative overflow-hidden">
        {/* Confetti layer */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  y: -10,
                  x: 20 + Math.random() * 300,
                  opacity: 1,
                  rotate: 0,
                }}
                animate={{
                  y: [0, 300 + Math.random() * 100],
                  x: 20 + Math.random() * 300 + (Math.random() - 0.5) * 80,
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
                  width: `${5 + Math.random() * 6}px`,
                  height: `${5 + Math.random() * 6}px`,
                  background: CONFETTI_COLORS[i % 10],
                }}
              />
            ))}
          </div>
        )}

        {/* Patient avatar (light bg, no gradient) */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-[88px] h-[88px] rounded-full bg-[#1e3a5f]/10 flex items-center justify-center mb-5"
        >
          <span className="text-[36px] font-bold text-[#1e3a5f]">AR</span>
        </motion.div>

        <p className="text-[26px] font-semibold text-[#1a1a2e] mb-1">Ana Rodriguez</p>
        <p className="text-[20px] text-[#64748b] mb-6">Te dejo una resena</p>

        {/* Stars */}
        <div className="flex items-center gap-3 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.div
              key={star}
              initial={{ scale: 0, rotate: -30 }}
              animate={
                star <= starsShown
                  ? { scale: [0, 1.4, 1], rotate: 0 }
                  : { scale: 0.6, rotate: 0 }
              }
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <svg
                viewBox="0 0 20 20"
                fill={star <= starsShown ? "#f59e0b" : "#e2e8f0"}
                className="w-[48px] h-[48px]"
              >
                <path d={STAR_PATH} />
              </svg>
            </motion.div>
          ))}
        </div>

        {starsShown >= 5 && (
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[#f59e0b] text-[28px] font-bold mb-6"
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
            className="w-full rounded-[16px] p-6 border bg-white border-[#e2e8f0] mb-6"
          >
            <p className="text-[22px] italic leading-relaxed text-[#475569]">
              &ldquo;Excelente servicio, muy profesional y puntual. Maria fue muy amable y explico todo el procedimiento. 100% recomendada.&rdquo;
            </p>
          </motion.div>
        )}

        {/* Tier level up */}
        {showTierUp && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.1, 1], opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full rounded-[16px] p-6 border-2 border-[#f59e0b]/40 bg-[#f59e0b]/5 text-center"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-[48px] mb-3"
            >
              &#11088;
            </motion.div>
            <p className="text-[26px] font-bold text-[#1a1a2e] mb-3">Nivel Actualizado</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-[20px] text-[#94a3b8]">Certificada</span>
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 0.6, repeat: 2 }}
                className="text-[#f59e0b] text-[24px]"
              >
                &rarr;
              </motion.span>
              <span className="text-[24px] font-bold text-[#f59e0b]">Destacada</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
