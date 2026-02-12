"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ── Step Engine ── */
export interface DemoStep {
  id: string;
  duration: number | null;
  title?: string;
  isFullScreen?: boolean;
  caption?: { step?: string; title: string; subtitle?: string };
}

export function useStepEngine(steps: DemoStep[]) {
  const [currentStep, setCurrentStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const step = steps[currentStep];
    if (step.duration && currentStep < steps.length - 1) {
      timerRef.current = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, step.duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentStep, steps]);

  const restart = useCallback(() => setCurrentStep(0), []);

  return { currentStep, step: steps[currentStep], restart };
}

/* ── Typing Effect ── */
export function useTypingEffect(
  text: string,
  speed: number,
  startDelay: number,
  active: boolean
) {
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

/* ── Delayed Visibility ── */
export function useDelayedShow(delay: number, active: boolean) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay, active]);

  return show;
}

/* ── Counter ── */
export function useCounter(
  from: number,
  to: number,
  intervalMs: number,
  active: boolean
) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!active) {
      setValue(from);
      return;
    }
    setValue(from);
    const dir = to > from ? 1 : -1;
    const interval = setInterval(() => {
      setValue((prev) => {
        const next = prev + dir;
        if ((dir > 0 && next >= to) || (dir < 0 && next <= to)) {
          clearInterval(interval);
          return to;
        }
        return next;
      });
    }, intervalMs);
    return () => clearInterval(interval);
  }, [from, to, intervalMs, active]);

  return value;
}

/* ── Progress ── */
export function useProgress(durationMs: number, active: boolean) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }
    setProgress(0);
    const steps = 50;
    const stepMs = durationMs / steps;
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setProgress(Math.min((current / steps) * 100, 100));
      if (current >= steps) clearInterval(interval);
    }, stepMs);
    return () => clearInterval(interval);
  }, [durationMs, active]);

  return progress;
}
