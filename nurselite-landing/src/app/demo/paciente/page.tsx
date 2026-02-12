"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  useStepEngine,
  useDelayedShow,
  useCounter,
  type DemoStep,
} from "../hooks";
import {
  DemoShell,
  Avatar,
  StarRating,
  SecurityCode,
  Confetti,
  TypingField,
  Card,
  LogoIntro,
  FinalScreen,
  RoleLanding,
  HorizontalStepper,
  TikTokDemo,
} from "../components";
import { useTypingEffect } from "../hooks";

const steps: DemoStep[] = [
  { id: "intro", duration: 4000, isFullScreen: true, caption: { step: "", title: "Enfermeria a domicilio, asi de facil", subtitle: "Verificadas, cerca de ti, pago seguro" } },
  { id: "landing", duration: 5000, isFullScreen: true, caption: { step: "", title: "Descarga la app" } },
  { id: "registro", duration: 6500, title: "Crear Cuenta", caption: { step: "1 de 9", title: "Crea tu cuenta" } },
  { id: "mapa", duration: 9000, title: "Enfermeras Cerca", caption: { step: "2 de 9", title: "Encuentra enfermeras cerca" } },
  { id: "perfil", duration: 6000, title: "Perfil de Enfermera", caption: { step: "3 de 9", title: "Ve perfiles verificados" } },
  { id: "solicitar", duration: 6000, title: "Solicitar Servicio", caption: { step: "4 de 9", title: "Solicita tu servicio" } },
  { id: "pago", duration: 6000, title: "Metodo de Pago", caption: { step: "5 de 9", title: "Pago 100% seguro" } },
  { id: "esperando", duration: 4000, title: "Confirmando", caption: { step: "6 de 9", title: "Esperando confirmacion" } },
  { id: "tracking", duration: 9000, title: "Seguimiento en Vivo", caption: { step: "7 de 9", title: "Seguimiento en tiempo real" } },
  { id: "review", duration: 7000, title: "Califica el Servicio", caption: { step: "8 de 9", title: "Califica tu experiencia" } },
  { id: "final", duration: null, isFullScreen: true },
];

export default function DemoPaciente() {
  const { currentStep, step } = useStepEngine(steps);
  const active = (id: string) => step.id === id;

  const renderContent = () => {
    if (step.isFullScreen) {
      if (active("intro")) return <LogoIntro subtitle="Disponible en Lima" />;
      if (active("landing")) return <RoleLanding activeRole="patient" active={true} />;
      if (active("final")) return <FinalScreen tagline="Cuidado profesional en tu hogar" />;
      return null;
    }

    return (
      <DemoShell title={step.title!}>
        {active("registro") && <RegistroStep active={true} />}
        {active("mapa") && <MapaStep active={true} />}
        {active("perfil") && <PerfilEnfermeraStep active={true} />}
        {active("solicitar") && <SolicitarStep active={true} />}
        {active("pago") && <PagoStep active={true} />}
        {active("esperando") && <EsperandoStep active={true} />}
        {active("tracking") && <TrackingStep active={true} />}
        {active("review") && <ReviewStep active={true} />}
      </DemoShell>
    );
  };

  return (
    <TikTokDemo steps={steps} currentStep={currentStep}>
      {renderContent()}
    </TikTokDemo>
  );
}

/* ── Registro Step ── */
function RegistroStep({ active }: { active: boolean }) {
  const showCheckbox = useDelayedShow(5500, active);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-[680px] mx-auto"
    >
      <TypingField
        label="Nombre"
        value="Ana"
        speed={80}
        startDelay={300}
        active={active}
      />
      <TypingField
        label="Apellido"
        value="Rodriguez"
        speed={80}
        startDelay={1300}
        active={active}
      />
      <TypingField
        label="Email"
        value="ana.rodriguez@gmail.com"
        speed={50}
        startDelay={2600}
        active={active}
      />
      <TypingField
        label="Telefono"
        value="999888777"
        speed={80}
        startDelay={4200}
        active={active}
      />

      {showCheckbox && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-4 mb-10"
        >
          <div className="w-9 h-9 rounded-lg bg-[#4a9d9a] flex items-center justify-center shrink-0">
            <span className="text-white text-[26px] font-bold">✓</span>
          </div>
          <span className="text-[24px] text-[#1a1a2e]">
            Acepto terminos y condiciones
          </span>
        </motion.div>
      )}

      {showCheckbox && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="w-full h-[56px] bg-[#1e3a5f] text-white rounded-[12px] text-[24px] font-semibold shadow-[0_4px_16px_rgba(30,58,95,0.3)]"
        >
          Crear Cuenta
        </motion.button>
      )}
    </motion.div>
  );
}

/* ── Mapa Step (with service bottom sheet) ── */
function MapaStep({ active }: { active: boolean }) {
  const showSheet = useDelayedShow(2000, active);
  const showServiceSelected = useDelayedShow(4000, active);
  const showNurseCard = useDelayedShow(5500, active);
  const showSolicitar = useDelayedShow(7000, active);

  const nurses = [
    { initials: "MG", rating: "4.9★", top: "20%", left: "25%" },
    { initials: "LP", rating: "4.7★", top: "40%", left: "55%" },
    { initials: "RS", rating: "4.5★", top: "55%", left: "20%" },
    { initials: "AT", rating: "4.8★", top: "30%", left: "70%" },
  ];

  const services = [
    { icon: "💉", name: "Inyeccion IM", selected: true },
    { icon: "🩹", name: "Curaciones", selected: false },
    { icon: "❤️", name: "Control vital", selected: false },
    { icon: "💊", name: "Medicacion", selected: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Map - taller to fill screen */}
      <div className="h-[600px] bg-gradient-to-br from-[#e2e8f0] to-[#cbd5e1] rounded-[16px] mb-4 relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Your location pin */}
        <motion.div
          initial={{ scale: 0 }}
          animate={active ? { scale: 1 } : { scale: 0 }}
          transition={{ delay: 0.3, duration: 0.4, type: "spring", stiffness: 300 }}
          className="absolute"
          style={{ top: "45%", left: "45%" }}
        >
          <div className="flex flex-col items-center">
            <div className="w-[44px] h-[44px] bg-[#3b82f6] rounded-full flex items-center justify-center shadow-lg border-4 border-white">
              <span className="text-white text-[20px] font-bold">Tu</span>
            </div>
            <motion.div
              animate={{ scale: [0, 2, 2], opacity: [0.5, 0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.3 }}
              className="absolute w-[44px] h-[44px] rounded-full bg-[#3b82f6]"
            />
          </div>
        </motion.div>

        {/* Nurse markers */}
        {nurses.map((nurse, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={active ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ delay: 0.5 + i * 0.3, duration: 0.4, type: "spring", stiffness: 300 }}
            className="absolute"
            style={{ top: nurse.top, left: nurse.left }}
          >
            <div className="bg-white rounded-2xl shadow-lg p-3 flex items-center gap-3 border-2 border-[#4a9d9a]">
              <Avatar initials={nurse.initials} size="sm" />
              <span className="text-[22px] font-bold text-[#1a1a2e] whitespace-nowrap">
                {nurse.rating}
              </span>
            </div>
          </motion.div>
        ))}

        {/* Badge overlay on map */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={active ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.8, duration: 0.4 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#1e3a5f] text-white rounded-full px-6 py-3 shadow-lg"
        >
          <span className="text-[22px] font-semibold">4 enfermeras cerca</span>
        </motion.div>
      </div>

      {/* Bottom Sheet - Service Selection */}
      {showSheet && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 25 }}
        >
          <div className="bg-white rounded-t-[24px] border border-[#f1f5f9] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] p-6">
            {/* Handle */}
            <div className="w-[40px] h-[5px] bg-[#d1d5db] rounded-full mx-auto mb-5" />

            <p className="text-[28px] font-bold text-[#1a1a2e] mb-5">
              ¿Que servicio necesitas?
            </p>

            {/* Service pills */}
            <div className="flex flex-wrap gap-3 mb-5">
              {services.map((service, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  className={`flex items-center gap-3 px-5 py-3 rounded-full border-2 transition-all ${
                    service.selected && showServiceSelected
                      ? "border-[#4a9d9a] bg-[#4a9d9a]/10"
                      : "border-[#e2e8f0] bg-white"
                  }`}
                >
                  <span className="text-[24px]">{service.icon}</span>
                  <span className="text-[22px] font-medium text-[#1a1a2e]">{service.name}</span>
                  {service.selected && showServiceSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-[18px] text-[#4a9d9a]"
                    >
                      ✓
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Nurse card after service selected */}
            {showNurseCard && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-[#f8fafc] rounded-2xl p-5 border border-[#e2e8f0]"
              >
                <p className="text-[20px] text-[#64748b] mb-3">Enfermera mas cercana</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar initials="MG" size="sm" />
                    <div>
                      <p className="text-[26px] font-bold text-[#1a1a2e]">Maria Elena G.</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[18px]">⭐</span>
                        <span className="text-[20px] text-[#64748b]">4.9 • 1.2 km</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[16px]">🛡️</span>
                    <span className="text-[18px] text-[#4a9d9a] font-semibold">CEP</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Solicitar button */}
            {showSolicitar && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full h-[56px] bg-[#1e3a5f] text-white rounded-[12px] text-[24px] font-semibold shadow-[0_4px_16px_rgba(30,58,95,0.3)] mt-5"
              >
                Solicitar Servicio
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── Perfil Enfermera Step ── */
function PerfilEnfermeraStep({ active }: { active: boolean }) {
  const showServices = useDelayedShow(1200, active);
  const showReviews = useDelayedShow(2500, active);
  const showButton = useDelayedShow(4000, active);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header with avatar and name */}
      <div className="flex flex-col items-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
        >
          <Avatar initials="MG" size="lg" ring="ring-4 ring-[#4a9d9a] ring-offset-4" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-center mt-6"
        >
          <p className="text-[36px] font-bold text-[#1a1a2e]">Maria Elena Garcia L.</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-[20px]">🛡️</span>
            <span className="text-[24px] text-[#4a9d9a] font-semibold">Verificada CEP 125430</span>
          </div>
        </motion.div>
      </div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="grid grid-cols-3 gap-4 mb-8"
      >
        <Card className="text-center !mb-0 !p-4">
          <p className="text-[40px] font-extrabold text-[#f59e0b]">⭐ 4.9</p>
          <p className="text-[18px] text-[#64748b]">Rating</p>
        </Card>
        <Card className="text-center !mb-0 !p-4">
          <p className="text-[40px] font-extrabold text-[#1a1a2e]">127</p>
          <p className="text-[18px] text-[#64748b]">Servicios</p>
        </Card>
        <Card className="text-center !mb-0 !p-4">
          <p className="text-[40px] font-extrabold text-[#1a1a2e]">48</p>
          <p className="text-[18px] text-[#64748b]">Resenas</p>
        </Card>
      </motion.div>

      {/* Tier badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="flex items-center justify-center mb-8"
      >
        <div className="px-6 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a] text-white text-[22px] font-bold rounded-full shadow-lg">
          Destacada - Nivel 2
        </div>
      </motion.div>

      {/* Services offered */}
      {showServices && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <p className="text-[26px] font-bold text-[#1a1a2e] mb-4">Servicios que ofrece</p>
            <div className="flex flex-wrap gap-3">
              {["Inyeccion IM", "Curaciones", "Control vital", "Medicacion"].map((s, i) => (
                <span
                  key={i}
                  className={`px-5 py-3 rounded-full text-[22px] font-medium border ${
                    i === 0
                      ? "bg-[#4a9d9a]/10 border-[#4a9d9a] text-[#4a9d9a]"
                      : "bg-[#f8fafc] border-[#e2e8f0] text-[#64748b]"
                  }`}
                >
                  {s}
                </span>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Recent review */}
      {showReviews && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <p className="text-[26px] font-bold text-[#1a1a2e] mb-4">Ultima resena</p>
            <div className="flex items-start gap-4">
              <Avatar initials="CP" size="sm" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[22px] font-semibold text-[#1a1a2e]">Carmen P.</span>
                  <span className="text-[18px] text-[#64748b]">hace 3 dias</span>
                </div>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className="text-[18px]">⭐</span>
                  ))}
                </div>
                <p className="text-[22px] text-[#64748b] leading-relaxed">
                  &ldquo;Muy profesional, llego puntual y fue muy amable&rdquo;
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* CTA */}
      {showButton && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-[56px] bg-[#1e3a5f] text-white rounded-[12px] text-[24px] font-semibold shadow-[0_4px_16px_rgba(30,58,95,0.3)]"
        >
          Solicitar Servicio
        </motion.button>
      )}
    </motion.div>
  );
}

/* ── Solicitar Step ── */
function SolicitarStep({ active }: { active: boolean }) {
  const showButton = useDelayedShow(2000, active);

  const details = [
    { icon: "💉", label: "Servicio", value: "Inyeccion Intramuscular" },
    { icon: "📍", label: "Ubicacion", value: "Miraflores, Lima" },
    { icon: "🕐", label: "Fecha", value: "Hoy, 15:30" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="mb-6">
        <div className="flex items-center gap-5 mb-6">
          <Avatar initials="MG" size="md" />
          <div>
            <p className="text-[32px] font-bold text-[#1a1a2e]">
              Maria Elena Garcia L.
            </p>
            <p className="text-[24px] text-[#64748b]">⭐ 4.9 • CEP 125430</p>
          </div>
        </div>
      </Card>

      <Card>
        {details.map((detail, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.2, duration: 0.3 }}
            className="flex items-start gap-5 mb-6 last:mb-0"
          >
            <div className="text-[48px] shrink-0">{detail.icon}</div>
            <div className="flex-1">
              <p className="text-[22px] text-[#64748b] mb-1">{detail.label}</p>
              <p className="text-[24px] font-semibold text-[#1a1a2e]">
                {detail.value}
              </p>
            </div>
          </motion.div>
        ))}
      </Card>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.3, duration: 0.4 }}
        className="my-10 text-center"
      >
        <p className="text-[24px] text-[#64748b] mb-3">Total</p>
        <p className="text-[72px] font-extrabold text-[#4a9d9a]">S/40.00</p>
      </motion.div>

      {showButton && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-[56px] bg-[#22c55e] text-white rounded-[12px] text-[24px] font-semibold shadow-[0_4px_12px_rgba(34,197,94,0.3)]"
        >
          Confirmar Solicitud
        </motion.button>
      )}
    </motion.div>
  );
}

/* ── Pago Step ── */
function PagoStep({ active }: { active: boolean }) {
  const showSummary = useDelayedShow(1500, active);
  const showButton = useDelayedShow(2500, active);

  const methods = [
    { id: "yape", name: "Yape", icon: "Y", color: "#6b21a8", selected: true },
    { id: "card", name: "Tarjeta de Credito", icon: "💳", color: "#3b82f6", selected: false },
    { id: "cash", name: "Efectivo", icon: "💵", color: "#22c55e", selected: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-[32px] font-bold text-[#1a1a2e] mb-6">
        Metodo de Pago
      </h3>

      <div className="space-y-5 mb-10">
        {methods.map((method, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.2, duration: 0.4 }}
            className={`bg-white rounded-[16px] border-2 p-5 flex items-center justify-between transition-all ${
              method.selected
                ? "border-[#4a9d9a] shadow-[0_2px_12px_rgba(74,157,154,0.15)]"
                : "border-[#e2e8f0]"
            }`}
          >
            <div className="flex items-center gap-5">
              <div
                className="w-[70px] h-[70px] rounded-xl flex items-center justify-center text-white text-[36px] font-bold shrink-0"
                style={{ backgroundColor: method.color }}
              >
                {method.icon}
              </div>
              <span className="text-[24px] font-semibold text-[#1a1a2e]">
                {method.name}
              </span>
            </div>
            {method.selected && (
              <div className="w-[48px] h-[48px] rounded-full bg-[#4a9d9a] flex items-center justify-center">
                <span className="text-white text-[32px]">✓</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {showSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <h4 className="text-[28px] font-bold text-[#1a1a2e] mb-6">
              Resumen
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[24px] text-[#64748b]">
                  Inyeccion Intramuscular
                </span>
                <span className="text-[26px] font-semibold text-[#1a1a2e]">
                  S/40.00
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[24px] text-[#64748b]">
                  Comision de servicio
                </span>
                <span className="text-[26px] font-semibold text-[#1a1a2e]">
                  S/0.00
                </span>
              </div>
              <div className="h-[2px] bg-[#e2e8f0] my-4" />
              <div className="flex justify-between items-center">
                <span className="text-[32px] font-bold text-[#1a1a2e]">
                  Total
                </span>
                <span className="text-[36px] font-extrabold text-[#4a9d9a]">
                  S/40.00
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {showButton && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-[56px] bg-[#6b21a8] text-white rounded-[12px] text-[24px] font-semibold shadow-[0_4px_16px_rgba(107,33,168,0.3)]"
        >
          Pagar con Yape S/40.00
        </motion.button>
      )}
    </motion.div>
  );
}

/* ── Esperando Step ── */
function EsperandoStep({ active }: { active: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[800px]"
    >
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
        className="w-[120px] h-[120px] border-8 border-[#e2e8f0] border-t-[#4a9d9a] rounded-full mb-10"
      />

      <p className="text-[32px] font-semibold text-[#1a1a2e] text-center mb-6 px-10">
        Esperando respuesta de Maria Elena
      </p>

      <motion.div
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="flex gap-3"
      >
        <span className="text-[48px]">•</span>
        <span className="text-[48px]">•</span>
        <span className="text-[48px]">•</span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="text-[24px] text-[#64748b] mt-10"
      >
        Tiempo de espera promedio: 2 min
      </motion.p>
    </motion.div>
  );
}

/* ── Tracking Step ── */
function TrackingStep({ active }: { active: boolean }) {
  const eta = useCounter(8, 1, 1000, active);
  const stepperIndex = Math.floor(useCounter(0, 4, 1800, active));
  const showToast = useDelayedShow(6000, active);

  const trackingSteps = [
    { label: "Aceptado", status: "accepted" },
    { label: "En camino", status: "on_the_way" },
    { label: "Llego", status: "arrived" },
    { label: "En servicio", status: "in_progress" },
    { label: "Completado", status: "completed" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Mini Map */}
      <div className="h-[500px] bg-gradient-to-br from-[#e2e8f0] to-[#cbd5e1] rounded-[16px] mb-6 relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern
              id="grid-tracking"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-tracking)" />
        </svg>

        {/* Route line - viewBox maps to % so path matches nurse movement */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M 20 80 Q 48 46 78 20"
            stroke="#4a9d9a"
            strokeWidth="4"
            strokeDasharray="3 2"
            fill="none"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={active ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 5, ease: "easeInOut" }}
          />
        </svg>

        {/* Destination marker */}
        <div className="absolute top-[17%] left-[78%] -translate-x-1/2 -translate-y-1/2">
          <div className="w-[50px] h-[50px] bg-[#22c55e] rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-[26px]">🏠</span>
          </div>
        </div>

        {/* Nurse marker with pulsing ring */}
        <motion.div
          initial={{ top: "80%", left: "20%" }}
          animate={
            active ? { top: "20%", left: "78%" } : { top: "80%", left: "20%" }
          }
          transition={{ duration: 5, ease: "easeInOut" }}
          className="absolute -translate-x-1/2 -translate-y-1/2"
        >
          {/* Pulsing ring */}
          <motion.div
            animate={{
              scale: [0, 2.5, 2.5],
              opacity: [0.6, 0.6, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 0.3,
              ease: "easeOut",
            }}
            className="absolute inset-0 w-[70px] h-[70px] rounded-full bg-[#3b82f6]"
          />
          {/* Avatar marker */}
          <div className="relative w-[70px] h-[70px] rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gradient-to-br from-[#1e3a5f] to-[#4a9d9a]">
            <div className="w-full h-full flex items-center justify-center text-white text-[32px] font-bold">
              MG
            </div>
          </div>
        </motion.div>

        {/* ETA Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="absolute top-6 right-6 bg-white rounded-xl shadow-lg px-6 py-4"
        >
          <p className="text-[20px] text-[#64748b] mb-1">Llega en</p>
          <p className="text-[36px] font-extrabold text-[#4a9d9a]">
            {eta} min
          </p>
        </motion.div>

        {/* Toast notification */}
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1e3a5f] text-white rounded-2xl px-8 py-5 shadow-2xl flex items-center gap-4"
          >
            <span className="text-[32px]">📍</span>
            <span className="text-[24px] font-semibold">
              Maria Elena esta cerca
            </span>
          </motion.div>
        )}
      </div>

      {/* Horizontal Stepper */}
      <HorizontalStepper steps={trackingSteps} activeIndex={stepperIndex} />

      {/* Security Code Section */}
      <Card>
        <div className="flex items-center justify-center gap-3 mb-5">
          <span className="text-[32px]">🛡️</span>
          <p className="text-[26px] font-bold text-[#1a1a2e]">
            Comparte este codigo con tu enfermera
          </p>
        </div>
        <SecurityCode digits={["4", "8", "2", "7", "1", "5"]} active={active} />
      </Card>

      {/* Nurse Info Card - Bottom Sheet Style */}
      <Card className="border-t-4 border-t-[#4a9d9a]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-5">
            <Avatar initials="MG" size="md" />
            <div>
              <p className="text-[32px] font-bold text-[#1a1a2e]">
                Maria Elena G.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[18px]">🛡️</span>
                <span className="text-[20px] text-[#4a9d9a] font-semibold">
                  Verificada CEP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rating and service count */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="text-[22px]">⭐</span>
            ))}
          </div>
          <span className="text-[24px] text-[#64748b] font-medium">
            4.9 • 127 servicios
          </span>
        </div>

        {/* Action buttons - circular like real app */}
        <div className="flex gap-4">
          <button className="w-[60px] h-[60px] rounded-full bg-[#22c55e] text-white flex items-center justify-center shadow-md shrink-0">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
            </svg>
          </button>
          <button className="w-[60px] h-[60px] rounded-full bg-[#3b82f6] text-white flex items-center justify-center shadow-md shrink-0 relative">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <div className="absolute -top-1 -right-1 w-[22px] h-[22px] bg-[#dc2626] rounded-full flex items-center justify-center text-white text-[12px] font-bold">
              2
            </div>
          </button>
        </div>
      </Card>
    </motion.div>
  );
}

/* ── Review Step ── */
function ReviewStep({ active }: { active: boolean }) {
  const { displayed, done } = useTypingEffect(
    "Excelente servicio, muy profesional y puntual",
    40,
    1500,
    active
  );
  const showCheckbox = useDelayedShow(4500, active);
  const showButton = useDelayedShow(5000, active);
  const showConfetti = useDelayedShow(5500, active);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center mb-8">
        <Avatar initials="MG" size="lg" ring="ring-4 ring-[#4a9d9a] ring-offset-4" />
        <p className="text-[36px] font-bold text-[#1a1a2e] mt-6">
          Maria Elena Garcia L.
        </p>
      </div>

      <StarRating count={5} active={active} staggerDelay={200} />

      <Card>
        <label className="block text-[24px] font-semibold text-[#1a1a2e] mb-3">
          Tu opinion
        </label>
        <div className="bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[12px] px-4 py-4 min-h-[120px]">
          <p className="text-[22px] text-[#1a1a2e] leading-relaxed">
            {displayed}
            {active && !done && (
              <span className="inline-block w-[2px] h-[24px] bg-[#1e3a5f] ml-1 animate-pulse" />
            )}
          </p>
        </div>
      </Card>

      {showCheckbox && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-9 h-9 rounded-lg bg-[#4a9d9a] flex items-center justify-center shrink-0">
            <span className="text-white text-[26px] font-bold">✓</span>
          </div>
          <span className="text-[24px] text-[#1a1a2e]">
            Permitir uso en testimonios
          </span>
        </motion.div>
      )}

      {showButton && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-[56px] bg-[#1e3a5f] text-white rounded-[12px] text-[24px] font-semibold shadow-[0_4px_16px_rgba(30,58,95,0.3)]"
        >
          Enviar Resena
        </motion.button>
      )}

      <Confetti active={showConfetti} count={40} />
    </motion.div>
  );
}
