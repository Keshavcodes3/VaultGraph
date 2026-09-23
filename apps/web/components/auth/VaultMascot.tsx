"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useCalm } from "../landing/Reveal";

export type MascotFocus = "none" | "name" | "email" | "password" | "confirm";
export type MascotMood = "calm" | "sleepy" | "curious" | "shy" | "happy";

type VaultMascotProps = {
  /** Which field the mascot is looking at. Drives subtle eye direction. */
  focus?: MascotFocus;
  /** Emotional state. Drives eyelids, hands, mouth and antenna. */
  mood?: MascotMood;
  /** Bump this counter on keystrokes to nudge the head. */
  wiggle?: number;
  className?: string;
};

/** Where the eyes drift for each focused field. Kept to a few px. */
const GAZE: Record<MascotFocus, { x: number; y: number }> = {
  none: { x: 0, y: 0 },
  name: { x: -2, y: 0.5 },
  email: { x: 0, y: 2.2 },
  password: { x: 0, y: 1 },
  confirm: { x: 2, y: 2 },
};

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * VaultGraph's tiny desk companion. Pure SVG shapes, monochrome:
 * rounded body, two capsule eyes, tiny feet, one antenna,
 * plus a little paper note leaning beside it.
 */
export default function VaultMascot({
  focus = "none",
  mood = "calm",
  wiggle = 0,
  className,
}: VaultMascotProps) {
  const calm = useCalm();
  const [blink, setBlink] = useState(false);

  // Subtle blink every few seconds. Never while sleepy, shy or celebrating.
  useEffect(() => {
    if (calm || mood === "sleepy" || mood === "shy" || mood === "happy") return;
    let inner: ReturnType<typeof setTimeout> | undefined;
    const outer = setInterval(() => {
      setBlink(true);
      inner = setTimeout(() => setBlink(false), 160);
    }, 3800);
    return () => {
      clearInterval(outer);
      if (inner) clearTimeout(inner);
    };
  }, [calm, mood]);

  const gaze = GAZE[focus];
  const lidScale = mood === "sleepy" ? 0.22 : blink ? 0.12 : 1;
  const eyeScale = mood === "curious" ? 1.14 : 1;
  const covering = mood === "shy";

  return (
    <motion.div
      className={className}
      role="img"
      aria-label="Vaulty, your tiny desk companion"
      // Happy bounce on success; faint head sway while typing an email.
      animate={
        calm
          ? undefined
          : {
              y: mood === "happy" ? [0, -9, 0] : 0,
              rotate: mood === "happy" ? 0 : wiggle % 2 === 0 ? 0.9 : -0.9,
            }
      }
      transition={
        mood === "happy"
          ? { duration: 0.45, ease: [...EASE] }
          : { duration: 0.28, ease: [...EASE] }
      }
    >
      <svg
        viewBox="0 0 128 112"
        className="h-[92px] w-auto sm:h-[108px]"
        fill="none"
        aria-hidden="true"
      >
        {/* soft floor shadow */}
        <ellipse cx="56" cy="102" rx="27" ry="4.5" fill="#0b0b10" opacity="0.07" />

        {/* tiny feet */}
        <rect x="42" y="92" width="11" height="6.5" rx="3.25" fill="#0b0b10" />
        <rect x="59" y="92" width="11" height="6.5" rx="3.25" fill="#0b0b10" />

        {/* little paper note leaning beside the body */}
        <g transform="rotate(9 96 78)">
          <rect
            x="85"
            y="62"
            width="22"
            height="28"
            rx="3.5"
            fill="#f7f7f9"
            stroke="#e8e8ee"
            strokeWidth="1.5"
          />
          <line x1="90" y1="70" x2="102" y2="70" stroke="#d6d6de" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="90" y1="75.5" x2="102" y2="75.5" stroke="#d6d6de" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="90" y1="81" x2="97" y2="81" stroke="#d6d6de" strokeWidth="1.6" strokeLinecap="round" />
        </g>

        {/* antenna */}
        <motion.g
          className="tbox"
          animate={calm ? undefined : { rotate: mood === "sleepy" ? 16 : 0 }}
          transition={{ duration: 0.35, ease: [...EASE] }}
        >
          <line
            x1="56"
            y1="36"
            x2="56"
            y2="24"
            stroke="#0b0b10"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="56" cy="20" r="3.6" fill="#0b0b10" />
        </motion.g>

        {/* rounded body */}
        <rect
          x="26"
          y="36"
          width="60"
          height="60"
          rx="21"
          fill="#ffffff"
          stroke="#e8e8ee"
          strokeWidth="1.5"
        />

        {/* eyes */}
        <motion.g
          animate={calm ? undefined : { x: gaze.x, y: gaze.y }}
          transition={{ duration: 0.25, ease: [...EASE] }}
        >
          <motion.rect
            x="43"
            y="57"
            width="7.5"
            height="12"
            rx="3.75"
            fill="#111116"
            className="tbox"
            animate={calm ? undefined : { scaleY: lidScale, scale: eyeScale }}
            transition={{ duration: 0.22, ease: [...EASE] }}
          />
          <motion.rect
            x="61.5"
            y="57"
            width="7.5"
            height="12"
            rx="3.75"
            fill="#111116"
            className="tbox"
            animate={calm ? undefined : { scaleY: lidScale, scale: eyeScale }}
            transition={{ duration: 0.22, ease: [...EASE] }}
          />
        </motion.g>

        {/* little hands that cover the eyes on password fields */}
        <motion.g
          initial={false}
          animate={calm ? undefined : { opacity: covering ? 1 : 0, y: covering ? 0 : 5 }}
          transition={{ duration: 0.25, ease: [...EASE] }}
          style={{ pointerEvents: "none" }}
        >
          <rect
            x="39"
            y="55.5"
            width="15"
            height="13"
            rx="6.5"
            fill="#f0f0f5"
            stroke="#e8e8ee"
            strokeWidth="1.2"
          />
          <rect
            x="58"
            y="55.5"
            width="15"
            height="13"
            rx="6.5"
            fill="#f0f0f5"
            stroke="#e8e8ee"
            strokeWidth="1.2"
          />
        </motion.g>

        {/* mouth: quiet smile when curious, full smile when happy, flat line when sleepy */}
        {mood === "sleepy" ? (
          <line
            x1="51"
            y1="79"
            x2="61"
            y2="79"
            stroke="#0b0b10"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.55"
          />
        ) : (
          <path
            d="M50 77.5 Q56 82 62 77.5"
            stroke="#0b0b10"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity={mood === "happy" ? 1 : mood === "curious" ? 0.6 : 0}
          />
        )}
      </svg>
    </motion.div>
  );
}
