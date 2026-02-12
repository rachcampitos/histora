"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useStepEngine,
  useTypingEffect,
  useDelayedShow,
  useCounter,
  useProgress,
  type DemoStep,
} from "../hooks";
import {
  DemoShell,
  Avatar,
  StarRating,
  Confetti,
  TypingField,
  Card,
  Toggle,
  LogoIntro,
  FinalScreen,
  RoleLanding,
  HorizontalStepper,
  TikTokDemo,
  MapBackground,
  ChatScreen,
} from "../components";

/* ── Steps Definition ── */
const steps: DemoStep[] = [
  { id: "intro", duration: 4000, isFullScreen: true, caption: { step: "", title: "Cada paciente que cuidas merece ser contado", subtitle: "NurseLite convierte tu dedicacion en reconocimiento" } },
  { id: "landing", duration: 5000, isFullScreen: true, caption: { step: "", title: "Descarga la app" } },
  { id: "registro", duration: 7000, title: "Registro Profesional", caption: { step: "", title: "Registrate como enfermera" } },
  { id: "validacion", duration: 6000, title: "Verificacion CEP", caption: { step: "", title: "Verificamos tu cedula profesional" } },
  { id: "resultado", duration: 5000, title: "Resultado de Verificacion", caption: { step: "", title: "Validacion automatica" } },
  { id: "servicios", duration: 7000, title: "Mis Servicios", caption: { step: "", title: "Configura tus servicios" } },
  { id: "perfil", duration: 7000, title: "Configurar Perfil", caption: { step: "", title: "Personaliza tu perfil" } },
  { id: "dashboard", duration: 6000, title: "Dashboard", caption: { step: "", title: "Tu panel profesional" } },
  { id: "solicitud", duration: 6000, title: "Nueva Solicitud", caption: { step: "", title: "Recibe solicitudes en tiempo real" } },
  { id: "chat", duration: 6000, title: "Chat", caption: { step: "", title: "Chat en tiempo real" } },
  { id: "encamino", duration: 13000, title: "Servicio Activo", caption: { step: "", title: "Servicio en progreso" } },
  { id: "completado", duration: 5000, title: "Servicio Completado", caption: { step: "", title: "Servicio completado" } },
  { id: "resena", duration: 9000, title: "Dashboard", caption: { step: "", title: "Recibe calificaciones y sube de nivel" } },
  { id: "final", duration: null, isFullScreen: true },
];

/* ── Main Component ── */
export default function DemoEnfermera() {
  const { currentStep, step } = useStepEngine(steps);
  const active = (id: string) => step.id === id;

  const renderContent = () => {
    if (step.isFullScreen) {
      if (active("intro")) return <LogoIntro subtitle="Para profesionales de enfermeria" />;
      if (active("landing")) return <RoleLanding activeRole="nurse" active={true} />;
      if (active("final")) return <FinalScreen tagline="Gana dinero con tu profesion" />;
      return null;
    }

    // Screens with custom full-height layouts (no DemoShell)
    if (active("dashboard")) return <DashboardStep active={true} />;
    if (active("resena")) return <ResenaStep active={true} />;
    if (active("chat")) return <ChatEnfermeraStep active={true} />;

    return (
      <DemoShell title={step.title!}>
        {active("registro") && <RegistroStep active={true} />}
        {active("validacion") && <ValidacionStep active={true} />}
        {active("resultado") && <ResultadoStep active={true} />}
        {active("servicios") && <ServiciosStep active={true} />}
        {active("perfil") && <PerfilStep active={true} />}
        {active("solicitud") && <SolicitudStep active={true} />}
        {active("encamino") && <EnCaminoStep active={true} />}
        {active("completado") && <CompletadoStep active={true} />}
      </DemoShell>
    );
  };

  return (
    <TikTokDemo steps={steps} currentStep={currentStep}>
      {renderContent()}
    </TikTokDemo>
  );
}

/* ── Step Components ── */

function RegistroStep({ active }: { active: boolean }) {
  const showTerms = useDelayedShow(6000, active);

  return (
    <div className="max-w-[680px] mx-auto">
      {/* Tab selector */}
      <div className="flex mb-8 gap-3">
        <div className="flex-1 h-[48px] rounded-[12px] bg-[#f1f5f9] text-[#94a3b8] flex items-center justify-center text-[20px] font-medium">
          Busco Enfermera
        </div>
        <div className="flex-1 h-[48px] rounded-[12px] bg-[#1e3a5f] text-white flex items-center justify-center text-[20px] font-semibold shadow-[0_2px_8px_rgba(30,58,95,0.3)]">
          Soy Enfermera
        </div>
      </div>

      {/* Typing fields */}
      <TypingField
        label="Nombre"
        value="Maria Elena"
        speed={70}
        startDelay={300}
        active={active}
      />
      <TypingField
        label="Apellido"
        value="Garcia Lopez"
        speed={70}
        startDelay={1400}
        active={active}
      />
      <TypingField
        label="Email"
        value="maria.garcia@gmail.com"
        speed={50}
        startDelay={2800}
        active={active}
      />
      <TypingField
        label="N° CEP"
        value="125430"
        speed={120}
        startDelay={4500}
        active={active}
      />

      {/* Checkbox */}
      {showTerms && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-9 h-9 rounded-lg bg-[#4a9d9a] flex items-center justify-center shrink-0">
            <span className="text-white text-[26px] font-bold">✓</span>
          </div>
          <span className="text-[24px] text-[#1a1a2e]">
            Acepto terminos y condiciones
          </span>
        </motion.div>
      )}

      {/* Button */}
      {showTerms && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="w-full h-[56px] bg-[#1e3a5f] text-white text-[24px] font-semibold rounded-[12px] shadow-[0_4px_16px_rgba(30,58,95,0.3)]"
        >
          Crear Cuenta
        </motion.button>
      )}
    </div>
  );
}

function ValidacionStep({ active }: { active: boolean }) {
  const progress = useProgress(4500, active);
  const [statusIndex, setStatusIndex] = useState(0);

  const statuses = [
    "Conectando con el CEP...",
    "Verificando numero 125430...",
    "Confirmando estado...",
  ];

  useEffect(() => {
    if (!active) {
      setStatusIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statuses.length);
    }, 1600);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[1400px]">
      {/* CEP Shield Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-[200px] h-[200px] rounded-2xl bg-gradient-to-br from-[#4a9d9a] to-[#22c55e] flex flex-col items-center justify-center mb-12 relative"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="text-[72px] font-extrabold text-white"
        >
          CEP
        </motion.div>
      </motion.div>

      {/* Title */}
      <h2 className="text-[40px] font-bold text-[#1a1a2e] mb-10 text-center">
        Verificando tu registro profesional
      </h2>

      {/* Progress bar */}
      <div className="w-[80%] h-4 bg-[#e2e8f0] rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-gradient-to-r from-[#4a9d9a] to-[#22c55e] rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={statusIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-[28px] text-[#64748b] font-medium mb-12"
        >
          {statuses[statusIndex]}
        </motion.p>
      </AnimatePresence>

      {/* Small text */}
      <p className="text-[22px] text-[#94a3b8] text-center px-20 leading-relaxed">
        Validacion automatica con el Colegio de Enfermeros del Peru
      </p>
    </div>
  );
}

function ResultadoStep({ active }: { active: boolean }) {
  const showBadge = useDelayedShow(800, active);
  const showRow1 = useDelayedShow(1400, active);
  const showRow2 = useDelayedShow(1700, active);
  const showRow3 = useDelayedShow(2000, active);
  const showButton = useDelayedShow(2500, active);

  return (
    <div className="flex flex-col items-center">
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0 }}
        animate={active ? { scale: 1 } : { scale: 0 }}
        transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 300 }}
      >
        <Avatar initials="MG" size="lg" ring="ring-4 ring-[#22c55e]" />
      </motion.div>

      {/* Badge */}
      {showBadge && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 400 }}
          className="mt-6 px-6 py-3 bg-[#22c55e] text-white text-[28px] font-bold rounded-full"
        >
          ✓ HABIL
        </motion.div>
      )}

      {/* Info Card */}
      <Card className="mt-10 w-full">
        {showRow1 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <p className="text-[22px] text-[#64748b] mb-2">Nombre</p>
            <p className="text-[28px] font-bold text-[#1a1a2e]">
              GARCIA LOPEZ MARIA ELENA
            </p>
          </motion.div>
        )}
        {showRow2 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <p className="text-[22px] text-[#64748b] mb-2">N° CEP</p>
            <p className="text-[28px] font-bold text-[#1a1a2e]">125430</p>
          </motion.div>
        )}
        {showRow3 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <p className="text-[22px] text-[#64748b] mb-2">Region</p>
            <p className="text-[28px] font-bold text-[#1a1a2e]">
              CONSEJO REGIONAL III LIMA METROPOLITANA
            </p>
          </motion.div>
        )}
      </Card>

      {/* Button */}
      {showButton && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full h-[56px] bg-[#22c55e] text-white text-[24px] font-semibold rounded-[12px] shadow-[0_4px_12px_rgba(34,197,94,0.3)]"
        >
          Si, soy yo
        </motion.button>
      )}
    </div>
  );
}

function ServiciosStep({ active }: { active: boolean }) {
  const showService2 = useDelayedShow(1500, active);
  const showService3 = useDelayedShow(2800, active);
  const showSummary = useDelayedShow(4500, active);

  const services = [
    { name: "Inyeccion Intramuscular", price: "S/40", category: "injection", icon: "💉", active: true },
    { name: "Curaciones", price: "S/60", category: "wound_care", icon: "🩹", active: true },
    { name: "Control de Signos Vitales", price: "S/35", category: "vital_signs", icon: "❤️", active: true },
  ];

  const visibleServices = [
    true,
    showService2,
    showService3,
  ];

  return (
    <div>
      {/* Header stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
        className="flex gap-4 mb-6"
      >
        <div className="flex-1 bg-[#1e3a5f]/5 rounded-[12px] p-4 text-center">
          <p className="text-[32px] font-bold text-[#1e3a5f]">
            {showService3 ? "3" : showService2 ? "2" : "1"}
          </p>
          <p className="text-[18px] text-[#64748b]">Total</p>
        </div>
        <div className="flex-1 bg-[#22c55e]/5 rounded-[12px] p-4 text-center">
          <p className="text-[32px] font-bold text-[#22c55e]">
            {showService3 ? "3" : showService2 ? "2" : "1"}
          </p>
          <p className="text-[18px] text-[#64748b]">Activos</p>
        </div>
        <div className="flex-1 bg-[#94a3b8]/5 rounded-[12px] p-4 text-center">
          <p className="text-[32px] font-bold text-[#94a3b8]">0</p>
          <p className="text-[18px] text-[#64748b]">Inactivos</p>
        </div>
      </motion.div>

      {/* Service cards */}
      {services.map((service, i) =>
        visibleServices[i] ? (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-[52px] h-[52px] rounded-[12px] bg-[#1e3a5f]/5 flex items-center justify-center text-[28px] shrink-0">
                    {service.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-[24px] font-semibold text-[#1a1a2e]">{service.name}</p>
                    <p className="text-[22px] font-bold text-[#4a9d9a]">{service.price}</p>
                  </div>
                </div>
                <Toggle on={service.active} />
              </div>
            </Card>
          </motion.div>
        ) : null
      )}

      {/* Add service button */}
      {showSummary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button className="w-full h-[56px] border-2 border-dashed border-[#4a9d9a] text-[#4a9d9a] rounded-[12px] text-[24px] font-semibold flex items-center justify-center gap-2 mb-6">
            + Agregar servicio
          </button>

          <div className="p-5 bg-[#dcfce7] border-2 border-[#22c55e] rounded-[12px] text-center">
            <p className="text-[24px] font-bold text-[#16a34a]">
              ✓ 3 servicios configurados
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function PerfilStep({ active }: { active: boolean }) {
  const [yapeOn, setYapeOn] = useState(false);
  const showAvailability = useDelayedShow(1200, active);
  const showPayment = useDelayedShow(2800, active);
  const showSuccess = useDelayedShow(5500, active);

  useEffect(() => {
    if (!active) {
      setYapeOn(false);
      return;
    }
    const timer = setTimeout(() => setYapeOn(true), 3500);
    return () => clearTimeout(timer);
  }, [active]);

  const days = [
    { label: "L", selected: true },
    { label: "M", selected: true },
    { label: "Mi", selected: true },
    { label: "J", selected: true },
    { label: "V", selected: true },
    { label: "S", selected: false },
    { label: "D", selected: false },
  ];

  return (
    <div>
      {/* Location */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-[48px] h-[48px] rounded-[12px] bg-[#3b82f6]/10 flex items-center justify-center text-[28px] shrink-0">
              📍
            </div>
            <div>
              <p className="text-[24px] font-semibold text-[#1a1a2e]">Ubicacion</p>
              <p className="text-[20px] text-[#4a9d9a] font-medium">Lima &gt; Miraflores</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Availability Schedule */}
      {showAvailability && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <p className="text-[24px] font-semibold text-[#1a1a2e] mb-4">Horario de disponibilidad</p>

            {/* Day pills */}
            <div className="flex gap-2 mb-5">
              {days.map((day, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={`flex-1 h-[48px] rounded-[10px] flex items-center justify-center text-[20px] font-semibold ${
                    day.selected
                      ? "bg-[#1e3a5f] text-white"
                      : "bg-[#f1f5f9] text-[#94a3b8]"
                  }`}
                >
                  {day.label}
                </motion.div>
              ))}
            </div>

            {/* Time range */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-[48px] bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[12px] flex items-center justify-center">
                <span className="text-[22px] font-semibold text-[#1a1a2e]">08:00</span>
              </div>
              <span className="text-[22px] text-[#94a3b8] font-medium">a</span>
              <div className="flex-1 h-[48px] bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[12px] flex items-center justify-center">
                <span className="text-[22px] font-semibold text-[#1a1a2e]">18:00</span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Payment Method */}
      {showPayment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-[48px] h-[48px] rounded-[12px] bg-[#6b21a8]/10 flex items-center justify-center text-[28px] shrink-0">
                  💜
                </div>
                <p className="text-[24px] font-semibold text-[#1a1a2e]">
                  Recibir pagos con Yape
                </p>
              </div>
              <Toggle on={yapeOn} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-[48px] h-[48px] rounded-[12px] bg-[#f59e0b]/10 flex items-center justify-center text-[28px] shrink-0">
                🏆
              </div>
              <div>
                <p className="text-[24px] font-semibold text-[#1a1a2e]">Plan Basico</p>
                <p className="text-[20px] text-[#22c55e] font-medium">Gratis - 0% comision</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Success message */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 bg-[#dcfce7] border-2 border-[#22c55e] rounded-[12px] text-center"
        >
          <p className="text-[24px] font-bold text-[#16a34a]">
            ✓ Perfil configurado correctamente
          </p>
        </motion.div>
      )}
    </div>
  );
}

function DashboardStep({ active }: { active: boolean }) {
  const [disponible, setDisponible] = useState(false);

  useEffect(() => {
    if (!active) {
      setDisponible(false);
      return;
    }
    const timer = setTimeout(() => setDisponible(true), 2000);
    return () => clearTimeout(timer);
  }, [active]);

  return (
    <div className="w-full h-full flex flex-col bg-[#f8fafc]">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a] shrink-0 pt-[44px] px-8 pb-10">
        <p className="text-[22px] text-white/90 mb-2">Bienvenida</p>
        <p className="text-[48px] font-extrabold text-white">Hola, Maria Elena</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-7 -mt-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="text-center !mb-0 !p-4">
              <p className="text-[40px] font-extrabold text-[#1a1a2e]">⭐ 4.8</p>
              <p className="text-[18px] text-[#64748b]">Rating</p>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="text-center !mb-0 !p-4">
              <p className="text-[40px] font-extrabold text-[#1a1a2e]">0</p>
              <p className="text-[18px] text-[#64748b]">Servicios</p>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="text-center !mb-0 !p-4">
              <p className="text-[40px] font-extrabold text-[#1a1a2e]">S/0</p>
              <p className="text-[18px] text-[#64748b]">Ganancias</p>
            </Card>
          </motion.div>
        </div>

        {/* Availability */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[24px] font-semibold text-[#1a1a2e]">Disponibilidad</p>
            <Toggle on={disponible} />
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={disponible ? "on" : "off"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`text-[24px] font-medium ${
                disponible ? "text-[#22c55e]" : "text-[#64748b]"
              }`}
            >
              {disponible ? "Disponible para solicitudes" : "No disponible"}
            </motion.p>
          </AnimatePresence>
        </Card>

        {/* Historial section */}
        <h3 className="text-[32px] font-bold text-[#1a1a2e] mb-6">
          Historial de Servicios
        </h3>
        <Card>
          <p className="text-[26px] text-[#94a3b8] text-center py-8">
            Aun no tienes servicios completados
          </p>
        </Card>
      </div>
    </div>
  );
}

function SolicitudStep({ active }: { active: boolean }) {
  const timer = useCounter(45, 38, 1000, active);
  const showDetails = useDelayedShow(800, active);
  const showAccepted = useDelayedShow(4000, active);

  return (
    <div>
      {!showAccepted ? (
        <>
          {/* Toast notification - like real app */}
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 25 }}
            className="bg-[#1e3a5f] rounded-[12px] px-5 py-4 mb-6 flex items-center gap-4 shadow-lg -mx-4"
          >
            <div className="w-[40px] h-[40px] rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[20px] font-bold text-white">Nueva solicitud</p>
              <p className="text-[18px] text-white/80">Ana Rodriguez solicita Inyeccion IM</p>
            </div>
            <span className="text-[18px] text-white/60 font-medium">Ahora</span>
          </motion.div>

          {/* Timer bar */}
          <div className="flex items-center justify-between bg-[#f59e0b]/10 rounded-[12px] px-5 py-3 mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-[10px] h-[10px] rounded-full bg-[#f59e0b]"
              />
              <span className="text-[22px] font-semibold text-[#92400e]">Tiempo para responder</span>
            </div>
            <span className="text-[28px] font-extrabold text-[#92400e]">{timer}s</span>
          </div>

          {/* Request details */}
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Patient card */}
              <Card>
                <div className="flex items-center gap-5 mb-5">
                  <Avatar initials="AR" size="sm" />
                  <div className="flex-1">
                    <p className="text-[28px] font-bold text-[#1a1a2e]">Ana Rodriguez</p>
                    <p className="text-[22px] text-[#64748b]">Inyeccion Intramuscular</p>
                  </div>
                  <p className="text-[28px] font-bold text-[#4a9d9a]">S/40</p>
                </div>
                <div className="h-[1px] bg-[#e2e8f0] mb-4" />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[22px]">📍</span>
                    <p className="text-[20px] text-[#64748b]">Miraflores, Lima - 1.2 km</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[22px]">🕐</span>
                    <p className="text-[20px] text-[#64748b]">Hoy, 15:30</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[22px]">💰</span>
                    <p className="text-[20px] text-[#4a9d9a] font-semibold">Tu ganancia: S/40.00</p>
                  </div>
                </div>
              </Card>

              {/* Buttons */}
              <div className="flex gap-4">
                <button className="flex-1 h-[60px] border-2 border-[#dc2626] text-[#dc2626] text-[26px] font-semibold rounded-[12px]">
                  Rechazar
                </button>
                <button className="flex-1 h-[60px] bg-[#22c55e] text-white text-[26px] font-semibold rounded-[12px] shadow-[0_4px_12px_rgba(34,197,94,0.3)]">
                  Aceptar
                </button>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center min-h-[1400px]"
        >
          <div className="text-center">
            <div className="w-[140px] h-[140px] mx-auto mb-8 rounded-full bg-[#22c55e] flex items-center justify-center">
              <span className="text-[80px] text-white font-bold">✓</span>
            </div>
            <p className="text-[38px] font-bold text-[#22c55e]">
              Solicitud Aceptada
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function EnCaminoStep({ active }: { active: boolean }) {
  const [seconds, setSeconds] = useState(0);
  // Phase transitions: en camino → arrived (map shrinks) → code entry → verified
  const hasArrived = useDelayedShow(5000, active);
  const showCode = useDelayedShow(6000, active);
  const showPatientDigits = useDelayedShow(7500, active);
  const showVerified = useDelayedShow(11500, active);
  const patientDigits = ["4", "8", "2", "7", "1", "5"];

  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [active]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Stepper index advances: 1 = en camino, 2 = llego
  const stepperIndex = hasArrived ? 2 : 1;

  return (
    <div>
      {/* Status header with timer */}
      <div className="bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5 mb-5 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <motion.div
            key={hasArrived ? "arrived" : "onway"}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: [1, 1.1, 1], opacity: 1 }}
            transition={hasArrived ? { duration: 0.4 } : { repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className={`px-5 py-2 text-white text-[20px] font-bold rounded-full ${
              hasArrived ? "bg-[#d97706]" : "bg-[#ea580c]"
            }`}
          >
            {hasArrived ? "He llegado" : "En camino"}
          </motion.div>
        </div>
        <p className="text-[48px] font-extrabold text-[#1a1a2e] leading-none">
          {formatTime(seconds)}
        </p>
      </div>

      {/* Horizontal Stepper */}
      <HorizontalStepper
        steps={[
          { label: "Aceptada", status: "accepted" },
          { label: "En camino", status: "on_the_way" },
          { label: "Llego", status: "arrived" },
          { label: "En curso", status: "in_progress" },
          { label: "Completado", status: "completed" },
        ]}
        activeIndex={stepperIndex}
      />

      {/* Map - animates from tall to short when arrived */}
      <motion.div
        animate={{ height: hasArrived ? 180 : 380 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="relative rounded-[16px] mb-5 overflow-hidden"
      >
        <MapBackground lng={-77.04} lat={-12.11} zoom={15} />

        {/* Dashed route polyline */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path
            d="M 20 25 Q 50 50 75 80"
            stroke="#4a9d9a"
            strokeWidth="4"
            strokeDasharray="6 4"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Nurse pulsing blue dot - moves to destination when arrived */}
        <motion.div
          animate={hasArrived
            ? { left: "75%", top: "78%", scale: [1, 1.3, 1] }
            : { left: "30%", top: "35%", scale: [1, 1.4, 1] }
          }
          transition={hasArrived
            ? { left: { duration: 0.8 }, top: { duration: 0.8 }, scale: { repeat: Infinity, duration: 1.5 } }
            : { scale: { repeat: Infinity, duration: 1.5 } }
          }
          className="absolute w-8 h-8 bg-[#3b82f6] rounded-full shadow-lg -translate-x-1/2 -translate-y-1/2"
        />

        {/* Patient destination pin */}
        <div
          className="absolute w-10 h-10 bg-[#dc2626] rounded-full shadow-lg flex items-center justify-center text-[20px] -translate-x-1/2 -translate-y-1/2"
          style={{ left: "75%", top: "80%" }}
        >
          📍
        </div>

        {/* Navigation banner - fades out when arrived */}
        <AnimatePresence>
          {!hasArrived && (
            <motion.div
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-4 left-4 right-4 bg-[#1e3a5f] text-white px-5 py-3 rounded-[12px] flex items-center gap-3"
            >
              <span className="text-[24px]">→</span>
              <p className="text-[18px] font-semibold">Gira a la derecha en 200 m</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* "Arrived" overlay when arrived */}
        <AnimatePresence>
          {hasArrived && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-[#d97706]/10 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4, type: "spring", stiffness: 300 }}
                className="bg-white/95 rounded-full px-6 py-3 shadow-lg flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-[#d97706] rounded-full flex items-center justify-center">
                  <span className="text-white text-[16px] font-bold">✓</span>
                </div>
                <span className="text-[20px] font-bold text-[#92400e]">Has llegado al destino</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Pulsing location indicator - visible while en camino */}
      <AnimatePresence>
        {!hasArrived && (
          <motion.div
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 mb-5 p-4 bg-white rounded-[12px] border border-[#f1f5f9] shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-4 h-4 bg-[#4a9d9a] rounded-full shrink-0"
            />
            <p className="text-[20px] text-[#4a9d9a] font-semibold">
              Transmitiendo ubicacion en tiempo real
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security code section - slides in when arrived */}
      <AnimatePresence>
        {showCode && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 25 }}
          >
            {/* Nurse's own code */}
            <Card>
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-[28px]">🛡️</span>
                  <h3 className="text-[24px] font-bold text-[#1a1a2e]">
                    Tu codigo de seguridad
                  </h3>
                </div>
                <p className="text-[18px] text-[#64748b] mb-4">
                  Comparte este codigo con el paciente
                </p>
                <div className="flex gap-2 justify-center">
                  {["9", "3", "5", "2", "8", "4"].map((digit, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.1, duration: 0.3, type: "spring", stiffness: 400 }}
                      className="w-[60px] h-[76px] bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a] text-white rounded-xl flex items-center justify-center text-[36px] font-extrabold shadow-lg"
                    >
                      {digit}
                    </motion.div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Patient code input */}
            <Card>
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-[28px]">🔑</span>
                  <h3 className="text-[24px] font-bold text-[#1a1a2e]">
                    Codigo del paciente
                  </h3>
                </div>
                <p className="text-[18px] text-[#64748b] mb-4">
                  Pide el codigo al paciente e ingresalo aqui
                </p>

                {showPatientDigits ? (
                  <div className="flex gap-2 justify-center">
                    {patientDigits.map((digit, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: i * 0.25,
                          duration: 0.3,
                          type: "spring",
                          stiffness: 400,
                          damping: 20,
                        }}
                        className="w-[60px] h-[76px] bg-white border-2 border-[#4a9d9a] rounded-xl flex items-center justify-center text-[36px] font-extrabold text-[#1e3a5f]"
                      >
                        {digit}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2 justify-center">
                    {patientDigits.map((_, i) => (
                      <div
                        key={i}
                        className="w-[60px] h-[76px] bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl"
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Verified badge */}
            {showVerified && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-[#dcfce7] border-2 border-[#22c55e] rounded-xl text-center"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-[#22c55e] rounded-full flex items-center justify-center text-white text-[24px] font-bold">
                    ✓
                  </div>
                  <p className="text-[24px] font-bold text-[#16a34a]">
                    Identidad verificada
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patient info card - always visible at bottom */}
      <Card className="mt-4">
        <div className="flex items-center gap-4">
          <Avatar initials="AR" size="sm" />
          <div className="flex-1">
            <p className="text-[24px] font-bold text-[#1a1a2e]">Ana Rodriguez</p>
            <p className="text-[20px] text-[#64748b]">Inyeccion IM • Miraflores</p>
          </div>
          <div className="flex gap-2">
            <button className="w-[48px] h-[48px] rounded-full bg-[#22c55e] text-white flex items-center justify-center shadow-md shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </button>
            <button className="w-[48px] h-[48px] rounded-full bg-[#3b82f6] text-white flex items-center justify-center shadow-md shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function CompletadoStep({ active }: { active: boolean }) {
  const showDetails = useDelayedShow(1500, active);

  return (
    <div>
      <Confetti active={active} />

      {/* Success badge */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={active ? { scale: 1, opacity: 1 } : {}}
        transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 300 }}
        className="flex flex-col items-center mb-6"
      >
        <div className="w-[100px] h-[100px] rounded-full bg-[#16a34a] flex items-center justify-center mb-4">
          <span className="text-white text-[52px] font-bold">✓</span>
        </div>
        <p className="text-[32px] font-bold text-[#16a34a]">Servicio completado</p>
      </motion.div>

      {/* Timer display */}
      <div className="bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5 mb-5 text-center">
        <p className="text-[20px] text-[#64748b] mb-1">Duracion total</p>
        <p className="text-[40px] font-extrabold text-[#1a1a2e] leading-none">
          00:08:23
        </p>
      </div>

      <HorizontalStepper
        steps={[
          { label: "Aceptada", status: "accepted" },
          { label: "En camino", status: "on_the_way" },
          { label: "Llego", status: "arrived" },
          { label: "En curso", status: "in_progress" },
          { label: "Completado", status: "completed" },
        ]}
        activeIndex={4}
      />

      {/* Service summary */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <div className="flex items-center gap-4 mb-4">
              <Avatar initials="AR" size="sm" />
              <div>
                <p className="text-[24px] font-bold text-[#1a1a2e]">Ana Rodriguez</p>
                <p className="text-[20px] text-[#64748b]">Inyeccion IM</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-[#f1f5f9]">
              <div>
                <p className="text-[18px] text-[#64748b]">Monto acordado</p>
                <p className="text-[28px] font-bold text-[#1a1a2e]">S/ 40</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#f0fdf4] rounded-full">
                <span className="text-[18px]">📱</span>
                <span className="text-[18px] font-semibold text-[#16a34a]">Yape</span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

/* ── Chat Enfermera Step ── */
function ChatEnfermeraStep({ active }: { active: boolean }) {
  const messages: { from: "me" | "other" | "system"; text: string; delay: number }[] = [
    { from: "system", text: "Servicio aceptado", delay: 300 },
    { from: "me", text: "Hola Ana, soy Maria Elena. Ya estoy en camino 🙂", delay: 800 },
    { from: "other", text: "Hola! Perfecto, te espero", delay: 2000 },
    { from: "me", text: "Llego en aprox 8 minutos", delay: 3000 },
    { from: "other", text: "Genial, la puerta es la azul del segundo piso", delay: 4200 },
    { from: "me", text: "Entendido, ya estoy cerca! 📍", delay: 5200 },
  ];

  return <ChatScreen active={active} role="nurse" messages={messages} />;
}

function ResenaStep({ active }: { active: boolean }) {
  const showModal = useDelayedShow(1500, active);
  const comment = "Excelente servicio, muy profesional y puntual";
  const { displayed } = useTypingEffect(comment, 40, 3000, active);
  const showCursor = active && displayed.length > 0 && displayed.length < comment.length;
  const showTierUpgrade = useDelayedShow(6500, active);
  const showConfetti = useDelayedShow(7500, active);

  return (
    <div className="w-full h-full flex flex-col bg-[#f8fafc] relative">
      <Confetti active={showConfetti} />

      {/* Gradient header */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a] shrink-0 pt-[44px] px-8 pb-10">
        <p className="text-[22px] text-white/90 mb-2">Bienvenida</p>
        <p className="text-[48px] font-extrabold text-white">Hola, Maria Elena</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-7 -mt-4">
        {/* Updated stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="text-center !mb-0 !p-4">
            <p className="text-[40px] font-extrabold text-[#1a1a2e]">⭐ 4.9</p>
            <p className="text-[18px] text-[#64748b]">Rating</p>
          </Card>
          <Card className="text-center !mb-0 !p-4">
            <p className="text-[40px] font-extrabold text-[#1a1a2e]">1</p>
            <p className="text-[18px] text-[#64748b]">Servicios</p>
          </Card>
          <Card className="text-center !mb-0 !p-4">
            <p className="text-[40px] font-extrabold text-[#4a9d9a]">S/40</p>
            <p className="text-[18px] text-[#64748b]">Ganancias</p>
          </Card>
        </div>

        {/* Disponibilidad */}
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-[26px] font-semibold text-[#1a1a2e]">Disponibilidad</p>
            <Toggle on={true} />
          </div>
          <p className="text-[22px] font-medium text-[#22c55e] mt-2">Disponible para solicitudes</p>
        </Card>
      </div>

      {/* Review Modal - Centered floating (like real app review-modal-floating) */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/50 z-40"
            />

            {/* Centered Modal Container */}
            <div className="absolute inset-0 flex items-center justify-center z-50 px-4">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 25 }}
                className="bg-white rounded-[20px] w-[92%] max-w-[600px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden"
              >
                <div className="px-8 pt-7 pb-8">
                  {/* Close button */}
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[28px] font-bold text-[#1a1a2e]">Nueva Resena</h3>
                    <button className="w-[36px] h-[36px] rounded-full bg-[#f1f5f9] flex items-center justify-center">
                      <span className="text-[20px] text-[#64748b] leading-none">✕</span>
                    </button>
                  </div>

                  {/* Patient info */}
                  <div className="flex items-center gap-4 mb-5">
                    <Avatar initials="AR" size="sm" />
                    <div>
                      <p className="text-[26px] font-bold text-[#1a1a2e]">Ana Rodriguez</p>
                      <p className="text-[20px] text-[#64748b]">Inyeccion Intramuscular</p>
                    </div>
                  </div>

                  {/* Stars */}
                  <StarRating active={showModal} count={5} staggerDelay={150} />

                  {/* Rating label */}
                  <p className="text-center text-[22px] font-semibold text-[#f59e0b] -mt-4 mb-4">Excelente</p>

                  {/* Suggestion chips */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Muy puntual", "Excelente trato", "Muy profesional"].map((chip, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.5 + i * 0.15 }}
                        className="px-4 py-2 bg-[#4a9d9a]/10 text-[#4a9d9a] text-[18px] font-medium rounded-full border border-[#4a9d9a]/20"
                      >
                        {chip}
                      </motion.span>
                    ))}
                  </div>

                  {/* Comment */}
                  <div className="bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[12px] px-4 py-3 mb-5 min-h-[70px]">
                    <p className="text-[20px] text-[#1a1a2e] leading-relaxed">
                      {displayed}
                      {showCursor && (
                        <span className="inline-block w-[2px] h-[24px] bg-[#1e3a5f] ml-1 animate-pulse" />
                      )}
                    </p>
                  </div>

                  {/* Tier upgrade */}
                  {showTierUpgrade && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-[#1e3a5f]/5 to-[#4a9d9a]/10 border-2 border-[#4a9d9a] rounded-[12px] p-5 text-center mb-5"
                    >
                      <p className="text-[22px] font-bold text-[#1a1a2e] mb-3">
                        Has subido de nivel
                      </p>
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="px-4 py-2 bg-[#94a3b8] text-white text-[18px] font-bold rounded-full">
                          Certificada
                        </div>
                        <span className="text-[24px]">→</span>
                        <motion.div
                          animate={{ scale: [1, 1.08, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="px-4 py-2 bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a] text-white text-[18px] font-bold rounded-full shadow-lg"
                        >
                          Destacada
                        </motion.div>
                      </div>
                      <p className="text-[16px] text-[#64748b]">Nivel 2 de 4</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
