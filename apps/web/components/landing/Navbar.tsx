"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const LINKS = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "GitHub", href: "https://github.com" },
];

export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="5.5" fill="#0b0b10" />
      <circle cx="5.5" cy="9" r="3.2" fill="#4f46e5" />
      <circle cx="26.5" cy="9" r="3.2" fill="#0b0b10" opacity="0.28" />
      <circle cx="7" cy="24.5" r="3.2" fill="#0b0b10" opacity="0.28" />
      <circle cx="25" cy="24.5" r="3.2" fill="#4f46e5" opacity="0.55" />
      <path
        d="M8 10.5 13 14M24 10.5 19 14M9 22.5 13.5 19M23 22.5 18.5 19"
        stroke="#0b0b10"
        strokeOpacity="0.3"
        strokeWidth="1.4"
      />
    </svg>
  );
}

/** Button that leans gently toward the cursor. */
export function Magnetic({ children }: { children: ReactNode }) {
  const calm = useReducedMotion() ?? false;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18 });
  const sy = useSpring(y, { stiffness: 260, damping: 18 });

  if (calm) return <>{children}</>;

  return (
    <motion.span
      style={{ x: sx, y: sy, display: "inline-flex" }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * 0.18);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.28);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center px-4"
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <nav
        className={`pointer-events-auto flex w-full max-w-[880px] items-center justify-between gap-4 rounded-pill border py-2.5 pr-2.5 pl-[18px] backdrop-blur-[14px] transition-all duration-300 ${
          scrolled
            ? "border-line bg-white/88 shadow-card"
            : "border-transparent bg-white/72"
        }`}
        aria-label="Primary"
      >
        <a href="#top" className="inline-flex items-center gap-2">
          <LogoMark />
          <span className="text-[16.5px] font-semibold tracking-[-0.02em]">
            VaultGraph
          </span>
        </a>

        <div className="flex items-center gap-1 max-md:hidden">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="rounded-pill px-[13px] py-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-soft hover:text-ink"
              {...(l.href.startsWith("http")
                ? { target: "_blank", rel: "noreferrer" }
                : {})}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Magnetic>
            <a
              href="#cta"
              className="group inline-flex items-center gap-[7px] rounded-pill bg-ink px-[18px] py-2.5 text-[13.5px] font-semibold tracking-[-0.01em] whitespace-nowrap text-white transition-colors duration-250 hover:bg-accent max-md:hidden"
            >
              Start building
              <ArrowRight
                size={15}
                strokeWidth={2.2}
                className="transition-transform duration-250 group-hover:translate-x-[3px]"
              />
            </a>
          </Magnetic>
          <button
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-white max-md:inline-flex"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="pointer-events-auto mt-2 flex w-full max-w-[880px] flex-col rounded-[20px] border border-line bg-white/97 p-2.5 shadow-pop"
            initial={{ opacity: 0, y: -8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {LINKS.map((l, i) => (
              <motion.a
                key={l.label}
                href={l.href}
                className="rounded-xl px-3.5 py-3 text-base font-medium tracking-[-0.01em] hover:bg-soft"
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.05 }}
              >
                {l.label}
              </motion.a>
            ))}
            <a
              href="#cta"
              className="mt-1.5 inline-flex items-center justify-center gap-2 rounded-xl bg-ink p-3 text-[15px] font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Start building
              <ArrowRight size={15} strokeWidth={2.2} />
            </a>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
