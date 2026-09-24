"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/** True when the user prefers reduced motion (never null). */
export function useCalm(): boolean {
  return useReducedMotion() ?? false;
}

type RevealProps = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
};

/** Fade-and-rise on scroll into view. Renders statically when calm. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  once = true,
}: RevealProps) {
  const calm = useCalm();
  if (calm) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.35 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="vg-eyebrow">{children}</p>;
}

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "center" | "left";
};

/** Editorial section heading: mono eyebrow, tight headline, gray lede. */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "center",
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div
      className={`mx-auto mb-16 flex max-w-[720px] flex-col gap-5 max-md:mb-11 ${
        centered ? "items-center text-center" : "ml-0 items-start text-left"
      }`}
    >
      {eyebrow ? (
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
      ) : null}
      <Reveal delay={0.06}>
        <h2 className="text-[clamp(32px,4.6vw,52px)] leading-[1.08] font-semibold tracking-[-0.03em] text-balance">
          {title}
        </h2>
      </Reveal>
      {lede ? (
        <Reveal delay={0.12}>
          <p className="max-w-[600px] text-[clamp(16px,2vw,19px)] leading-[1.65] text-ink-soft text-pretty">
            {lede}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
