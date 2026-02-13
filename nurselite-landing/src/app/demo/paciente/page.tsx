"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useStepEngine,
  useTypingEffect,
  useDelayedShow,
  useCounter,
  type DemoStep,
} from "../hooks";
import {
  LogoIntro,
  FinalScreen,
  TikTokDemo,
} from "../components";

/* ── SVG Star path (reusable) ── */
const STAR_PATH = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";
const CONFETTI_COLORS = ["#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#f43f5e", "#4a9d9a", "#f97316", "#06b6d4", "#ec4899", "#eab308"];

const steps: DemoStep[] = [
  { id: "intro", duration: 3000, isFullScreen: true, caption: { title: "Enfermeria a domicilio, asi de facil", subtitle: "Verificadas, cerca de ti, pago seguro" } },
  { id: "mapa", duration: 5000, caption: { title: "Encuentra enfermeras cerca" } },
  { id: "tracking", duration: 7000, caption: { title: "Seguimiento en tiempo real" } },
  { id: "review", duration: 6000, caption: { title: "Califica tu experiencia" } },
  { id: "final", duration: null, isFullScreen: true },
];

export default function DemoPaciente() {
  const { currentStep, step } = useStepEngine(steps);
  const active = (id: string) => step.id === id;

  const renderContent = () => {
    if (active("intro")) return <LogoIntro subtitle="Disponible en Lima" />;
    if (active("final")) return <FinalScreen tagline="Cuidado profesional en tu hogar" />;
    if (active("mapa")) return <MapaScreen />;
    if (active("tracking")) return <TrackingScreen />;
    if (active("review")) return <ReviewScreen />;
    return null;
  };

  return (
    <TikTokDemo steps={steps} currentStep={currentStep}>
      {renderContent()}
    </TikTokDemo>
  );
}

/* ════════════════════════════════════════════════
   SCREEN 1: Mapa (based on PatientMapScreen)
   ════════════════════════════════════════════════ */
function MapaScreen() {
  const showCard = useDelayedShow(1800, true);

  const nurses = [
    { top: "25%", left: "30%", initials: "MG", delay: 0.3 },
    { top: "40%", left: "60%", initials: "LP", delay: 0.5 },
    { top: "55%", left: "25%", initials: "RS", delay: 0.7 },
    { top: "35%", left: "75%", initials: "AT", delay: 0.9 },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#f8fafc]">
      {/* Simulated map */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#e2e8f0] via-[#f1f5f9] to-[#e2e8f0]">
          {/* Grid lines for map feel */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(8)].map((_, i) => (
              <div key={`h-${i}`} className="absolute w-full h-px bg-[#94a3b8]" style={{ top: `${(i + 1) * 12}%` }} />
            ))}
            {[...Array(6)].map((_, i) => (
              <div key={`v-${i}`} className="absolute h-full w-px bg-[#94a3b8]" style={{ left: `${(i + 1) * 16}%` }} />
            ))}
          </div>

          {/* Nurse markers */}
          {nurses.map((marker, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: marker.delay, duration: 0.4, type: "spring", stiffness: 300, damping: 12 }}
              className="absolute"
              style={{ top: marker.top, left: marker.left }}
            >
              <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center ring-2 ring-white shadow-lg">
                <span className="text-white text-[20px] font-bold">{marker.initials}</span>
              </div>
            </motion.div>
          ))}

          {/* Badge: enfermeras cerca */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="absolute top-[50px] left-1/2 -translate-x-1/2 px-8 py-4 rounded-full bg-[#1e3a5f] shadow-lg"
          >
            <span className="text-white text-[24px] font-semibold">4 enfermeras cerca</span>
          </motion.div>
        </div>
      </div>

      {/* Bottom card */}
      <AnimatePresence>
        {showCard && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 25 }}
            className="bg-white px-7 py-5 border-t border-[#e2e8f0] shrink-0"
          >
            <div className="flex items-center gap-5 mb-5">
              <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center ring-2 ring-[#f59e0b] shadow-md">
                <span className="text-white text-[24px] font-bold">MC</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="text-[26px] font-semibold text-[#1a1a2e]">Maria C.</p>
                  <div className="flex items-center gap-1">
                    <svg viewBox="0 0 20 20" fill="#f59e0b" className="w-[20px] h-[20px]">
                      <path d={STAR_PATH} />
                    </svg>
                    <span className="text-[20px] text-[#f59e0b] font-semibold">4.9</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[18px] text-[#22c55e] font-medium">CEP Verificada</span>
                  <span className="text-[18px] text-[#94a3b8]">1.2 km</span>
                </div>
              </div>
            </div>
            <div className="rounded-[16px] py-5 flex items-center justify-center bg-[#1e3a5f] shadow-[0_4px_16px_rgba(30,58,95,0.3)]">
              <span className="text-white text-[24px] font-semibold">Solicitar Servicio</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════
   SCREEN 2: Tracking (based on PatientTrackingScreen)
   ════════════════════════════════════════════════ */
function TrackingScreen() {
  const [activeStep, setActiveStep] = useState(0);
  const eta = useCounter(8, 1, 800, true);

  const trackingSteps = [
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
      setTimeout(() => setActiveStep(3), 3600),
      setTimeout(() => setActiveStep(4), 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-[#f8fafc]">
      {/* Mini map area */}
      <div className="h-[35%] relative overflow-hidden bg-[#e2e8f0]">
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
            transition={{ duration: 3, delay: 0.5 }}
          />
          <circle cx="30" cy="60" r="5" fill="#4a9d9a" />
          <circle cx="180" cy="25" r="5" fill="#1e3a5f" />
          {/* Moving nurse dot */}
          <motion.circle
            r="6"
            fill="#f97316"
            initial={{ cx: 30, cy: 60 }}
            animate={{ cx: 120, cy: 40 }}
            transition={{ duration: 5, delay: 0.5, ease: "easeInOut" }}
          />
        </svg>

        {/* ETA badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0 }}
          className="absolute top-5 right-5 bg-[#1e3a5f] rounded-[16px] px-5 py-3 flex items-center gap-3 shadow-lg"
        >
          <span className="text-[24px]">&#128337;</span>
          <span className="text-white text-[24px] font-bold">{eta} min</span>
        </motion.div>
      </div>

      {/* Vertical stepper */}
      <div className="flex-1 px-8 py-6 overflow-y-auto">
        <div className="pl-3 mb-6">
          {trackingSteps.map((s, i) => {
            const isCompleted = i < activeStep;
            const isActive = i === activeStep;

            return (
              <div key={s.label} className="flex items-start gap-6">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {isActive && (
                      <motion.div
                        animate={{ scale: [0, 2.5], opacity: [0.5, 0] }}
                        transition={{ duration: 1.5, ease: "easeOut", repeat: Infinity, repeatDelay: 0.3 }}
                        className="absolute inset-0 rounded-full"
                        style={{ background: s.color }}
                      />
                    )}
                    <div
                      className="relative w-[36px] h-[36px] rounded-full flex items-center justify-center transition-all duration-400"
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
                    </div>
                  </div>
                  {i < trackingSteps.length - 1 && (
                    <div className="relative w-[4px] h-[32px]">
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
                </div>
              </div>
            );
          })}
        </div>

        {/* Nurse card */}
        <div className="rounded-[16px] p-5 flex items-center gap-5 border bg-white border-[#e2e8f0] mb-5">
          <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center ring-2 ring-[#f59e0b]">
            <span className="text-white text-[18px] font-bold">MC</span>
          </div>
          <div className="flex-1">
            <p className="text-[24px] font-semibold text-[#1a1a2e]">Maria C.</p>
            <p className="text-[18px] text-[#4a9d9a]">Enfermera Certificada</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-[12px] px-4 py-3 bg-[#f1f5f9]">
              <span className="text-[20px]">&#128222;</span>
            </div>
            <div className="rounded-[12px] px-4 py-3 bg-[#f1f5f9]">
              <span className="text-[20px]">&#128172;</span>
            </div>
          </div>
        </div>

        {/* Security code */}
        <div className="rounded-[16px] p-5 border bg-white border-[#e2e8f0] text-center">
          <p className="text-[18px] text-[#94a3b8] mb-3">Codigo de Seguridad</p>
          <div className="flex justify-center gap-3">
            {["4", "8", "2", "7", "1", "5"].map((digit, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.5 + i * 0.15 }}
                className="w-[52px] h-[64px] rounded-[12px] flex items-center justify-center text-[28px] font-bold border-2 bg-[#f8fafc] border-[#e2e8f0] text-[#1a1a2e]"
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
   SCREEN 3: Review (based on PatientReviewScreen)
   ════════════════════════════════════════════════ */
function ReviewScreen() {
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
      setTimeout(() => setShowOptIn(true), 4200),
      setTimeout(() => setSubmitted(true), 4800),
      setTimeout(() => setShowConfetti(true), 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-[#0f172a] pt-[44px] pb-5 px-8 shrink-0">
        <div className="flex items-center justify-between">
          <div className="w-[36px] h-[36px] rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-[22px] leading-none">&#8249;</span>
          </div>
          <span className="text-white text-[26px] font-semibold">Calificar Servicio</span>
          <div className="w-[36px]" />
        </div>
      </div>

      <div className="flex-1 px-8 py-6 flex flex-col items-center relative overflow-hidden">
        {/* Confetti layer */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {[...Array(18)].map((_, i) => (
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
                  delay: i * 0.05,
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

        {/* Nurse avatar */}
        <div className="w-[88px] h-[88px] rounded-full bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f] flex items-center justify-center ring-2 ring-[#f59e0b] mb-5 shadow-lg">
          <span className="text-white text-[36px] font-bold">MC</span>
        </div>
        <p className="text-[26px] font-semibold text-[#1a1a2e] mb-1">Maria C.</p>
        <p className="text-[20px] text-[#64748b] mb-7">Como fue tu experiencia?</p>

        {/* Stars */}
        <div className="flex items-center gap-4 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.div
              key={star}
              initial={{ scale: 0.6 }}
              animate={
                star <= rating
                  ? { scale: [0.6, 1.4, 1], rotate: [0, -15, 15, 0] }
                  : { scale: 0.6 }
              }
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <svg
                viewBox="0 0 20 20"
                fill={star <= rating ? "#f59e0b" : "#e2e8f0"}
                className="w-[52px] h-[52px]"
              >
                <path d={STAR_PATH} />
              </svg>
            </motion.div>
          ))}
        </div>

        {rating >= 5 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[#f59e0b] text-[24px] font-semibold mb-6"
          >
            Excelente
          </motion.p>
        )}

        {/* Comment area */}
        {showComment && !submitted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-[16px] p-5 border bg-white border-[#e2e8f0] mb-5"
          >
            <p className="text-[18px] text-[#94a3b8] mb-2">Tu comentario</p>
            <p className="text-[22px] min-h-[48px] leading-relaxed text-[#1a1a2e]">
              {typedComment}
              {typedComment.length < comment.length && (
                <span className="inline-block w-[2px] h-[24px] bg-[#4a9d9a] ml-[1px] align-middle animate-[blink_1s_step-end_infinite]" />
              )}
            </p>
          </motion.div>
        )}

        {/* Opt-in checkbox */}
        {showOptIn && !submitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-4 w-full mb-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              className="w-[32px] h-[32px] rounded-[8px] border border-[#4a9d9a] bg-[#4a9d9a] flex items-center justify-center flex-shrink-0"
            >
              <span className="text-white text-[18px] font-bold">{"\u2713"}</span>
            </motion.div>
            <p className="text-[20px] text-[#94a3b8]">Permitir uso publico de mi resena</p>
          </motion.div>
        )}

        <div className="flex-1" />

        {/* Submit / success */}
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: showOptIn ? 1 : 0.4 }}
              className="w-full rounded-[16px] py-5 flex items-center justify-center bg-[#1e3a5f]"
            >
              <span className="text-white text-[24px] font-semibold">Enviar Resena</span>
            </motion.div>
          ) : (
            <motion.div
              key="thanks"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-full rounded-[16px] py-5 flex items-center justify-center bg-[#22c55e] relative z-10"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.15 }}
                className="text-white text-[26px] font-bold"
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
