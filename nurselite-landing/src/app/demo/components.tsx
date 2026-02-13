"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DemoStep } from "./hooks";
import Image from "next/image";

/* Design width: screen width at recording resolution (1080×1920 viewport) */
const DESIGN_WIDTH = 778;

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
  gradient = true,
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
  ring?: string;
  gradient?: boolean;
}) {
  const sizes = {
    sm: "w-[64px] h-[64px] text-[26px]",
    md: "w-[100px] h-[100px] text-[42px]",
    lg: "w-[140px] h-[140px] text-[56px]",
  };
  return (
    <div
      className={`${sizes[size]} rounded-full ${
        gradient
          ? "bg-gradient-to-br from-[#4a9d9a] to-[#1e3a5f]"
          : "bg-[#1e3a5f]/10"
      } text-${gradient ? "white" : "[#1e3a5f]"} flex items-center justify-center font-bold shrink-0 ${ring || ""}`}
    >
      {initials}
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

/* ── Confetti ── */
const CONFETTI_COLORS = ["#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#f43f5e", "#4a9d9a", "#f97316", "#06b6d4", "#ec4899", "#eab308"];

export function Confetti({ active, count = 40 }: { active: boolean; count?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const particles = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: count }).map(() => ({
      x: Math.random() * DESIGN_WIDTH,
      duration: 1.5 + Math.random(),
      delay: Math.random() * 0.5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    }));
  }, [mounted, count]);

  if (!active || !mounted) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: p.x, y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: DESIGN_WIDTH * 2.1, rotate: 720, opacity: 0 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          className="absolute w-[10px] h-[10px] rounded-sm"
          style={{ background: p.color }}
        />
      ))}
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

/* ── Phone Mockup (iPhone frame) ── */
export function PhoneMockup({ children }: { children: React.ReactNode }) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [screen, setScreen] = useState({ w: DESIGN_WIDTH, h: DESIGN_WIDTH * 2.05 });

  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0) setScreen({ w: width, h: height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = screen.w / DESIGN_WIDTH;

  return (
    <div className="relative flex items-center justify-center h-[86vh] px-4">
      {/* Glow behind phone */}
      <div className="absolute w-[60%] h-[50%] bg-gradient-to-br from-[#4a9d9a]/30 to-[#1e3a5f]/30 blur-[60px] rounded-full" />

      {/* Phone frame — width drives sizing, aspect-ratio computes height */}
      <div
        className="relative bg-[#0f172a] rounded-[3.5rem] p-3.5"
        style={{
          aspectRatio: "10 / 20.5",
          width: "min(calc(86vh / 2.05), calc(100vw - 2rem))",
          boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Screen */}
        <div ref={screenRef} className="relative rounded-[3rem] w-full h-full overflow-hidden bg-[#f8fafc]">
          {/* Scaled content wrapper — renders at DESIGN_WIDTH then scales to fit */}
          <div
            className="relative"
            style={{
              width: DESIGN_WIDTH,
              height: screen.h / scale,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {/* Dynamic Island */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-50" />
            {/* Content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Caption Header (text above mockup) ── */
export function CaptionHeader({
  caption,
}: {
  caption?: { step?: string; title: string; subtitle?: string };
}) {
  return (
    <div className="shrink-0 h-[12vh] flex items-end justify-center pb-2">
      <AnimatePresence mode="wait">
        {caption && (
          <motion.div
            key={caption.title}
            initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <p className="text-[clamp(20px,3.9vmin,42px)] font-bold text-white leading-tight">
              {caption.title}
            </p>
            {caption.subtitle && (
              <p className="text-[clamp(14px,2.6vmin,28px)] text-slate-300 mt-1">
                {caption.subtitle}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── TikTok Demo Layout Wrapper ── */
export function TikTokDemo({
  steps,
  currentStep,
  children,
}: {
  steps: DemoStep[];
  currentStep: number;
  children: React.ReactNode;
}) {
  const step = steps[currentStep];
  const caption = step?.caption;

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      <CaptionHeader caption={caption} />

      <PhoneMockup>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </PhoneMockup>
    </div>
  );
}
