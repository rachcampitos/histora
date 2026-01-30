"use client";

import { motion, useInView, useReducedMotion, Variants } from "framer-motion";
import { useRef, ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none" | "scale" | "blur";
  duration?: number;
  once?: boolean;
}

const getVariants = (direction: string, shouldReduceMotion: boolean | null): Variants => {
  if (shouldReduceMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    };
  }

  const directions: Record<string, { x?: number; y?: number; scale?: number; filter?: string }> = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
    scale: { scale: 0.95 },
    blur: { y: 20, filter: "blur(10px)" },
    none: {},
  };

  return {
    hidden: {
      opacity: 0,
      ...directions[direction],
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
    },
  };
};

export function AnimatedSection({
  children,
  className = "",
  delay = 0,
  direction = "up",
  duration = 0.6,
  once = true,
}: AnimatedSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-50px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={getVariants(direction, shouldReduceMotion)}
      transition={{
        duration: shouldReduceMotion ? 0.2 : duration,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger children animation wrapper
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.1,
}: StaggerContainerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const shouldReduceMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Individual stagger item
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className = "" }: StaggerItemProps) {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// Parallax effect component
interface ParallaxProps {
  children: ReactNode;
  className?: string;
  speed?: number; // 0.1 = subtle, 0.5 = more pronounced
}

export function Parallax({ children, className = "", speed = 0.1 }: ParallaxProps) {
  const ref = useRef(null);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ y: 0 }}
      whileInView={{ y: 0 }}
      viewport={{ once: false }}
      style={{
        willChange: "transform",
      }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 30,
      }}
    >
      {children}
    </motion.div>
  );
}

// Scale on scroll component
interface ScaleOnScrollProps {
  children: ReactNode;
  className?: string;
}

export function ScaleOnScroll({ children, className = "" }: ScaleOnScrollProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
      transition={{
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Counter animation for numbers - simple fade in
interface AnimatedCounterProps {
  value: number | string;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  className = "",
}: AnimatedCounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
      transition={{ duration: shouldReduceMotion ? 0.2 : 0.5, ease: "easeOut" }}
    >
      {prefix}{value}{suffix}
    </motion.span>
  );
}

// Modern blur-to-focus text reveal effect (2025 trend)
interface TextRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function TextReveal({ children, className = "", delay = 0 }: TextRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        filter: shouldReduceMotion ? "none" : "blur(10px)",
        y: shouldReduceMotion ? 0 : 20,
      }}
      animate={
        isInView
          ? { opacity: 1, filter: "blur(0px)", y: 0 }
          : { opacity: 0, filter: shouldReduceMotion ? "none" : "blur(10px)", y: shouldReduceMotion ? 0 : 20 }
      }
      transition={{
        duration: shouldReduceMotion ? 0.2 : 0.8,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

// Smooth scroll progress indicator
interface ScrollProgressProps {
  className?: string;
}

export function ScrollProgress({ className = "" }: ScrollProgressProps) {
  return (
    <motion.div
      className={`fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1e3a5f] to-[#4a9d9a] origin-left z-50 ${className}`}
      style={{ scaleX: 0 }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 0 }}
      transition={{ duration: 0.1 }}
    />
  );
}
