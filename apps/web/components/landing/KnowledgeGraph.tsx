"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useCalm } from "./Reveal";

const FILES = [
  {
    id: "notes",
    label: "Notes",
    x: 180,
    y: 145,
    rotate: -5,
  },
  {
    id: "research",
    label: "Research",
    x: 620,
    y: 155,
    rotate: 4,
  },
  {
    id: "projects",
    label: "Projects",
    x: 150,
    y: 380,
    rotate: 3,
  },
  {
    id: "docs",
    label: "Documents",
    x: 650,
    y: 375,
    rotate: -4,
  },
];

function Document({
  label,
  rotate,
}: {
  label: string;
  rotate: number;
}) {
  return (
    <motion.div
      animate={{
        y: [0, -3, 0],
        rotate: [rotate, rotate + 1, rotate],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="absolute w-[105px] rounded-xl border border-[#e7e7ea] bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.035)]"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="h-2 w-2 rounded-full bg-[#111116]" />
        <div className="h-1 w-8 rounded-full bg-[#eeeeef]" />
      </div>

      <div className="space-y-1.5">
        <div className="h-1.5 w-[72%] rounded-full bg-[#e8e8eb]" />
        <div className="h-1.5 w-full rounded-full bg-[#f0f0f2]" />
        <div className="h-1.5 w-[58%] rounded-full bg-[#f0f0f2]" />
      </div>

      <div className="mt-3 text-[8px] font-medium text-[#a1a1aa]">
        {label}
      </div>
    </motion.div>
  );
}

function Bot({ calm }: { calm: boolean }) {
  const [looking, setLooking] = useState<"left" | "right">("left");

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 z-20"
      style={{ x: "-50%", y: "-50%" }}
      animate={
        calm
          ? undefined
          : {
              y: ["-50%", "calc(-50% - 5px)", "-50%"],
            }
      }
      transition={{
        duration: 3.2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      onAnimationComplete={() =>
        setLooking((value) => (value === "left" ? "right" : "left"))
      }
    >
      {/* shadow */}
      <motion.div
        className="absolute -bottom-3 left-1/2 h-3 w-20 -translate-x-1/2 rounded-full bg-black/[0.06] blur-md"
        animate={
          calm
            ? undefined
            : {
                scaleX: [1, 0.88, 1],
                opacity: [0.5, 0.3, 0.5],
              }
        }
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* antenna */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2">
        <div className="mx-auto h-5 w-px bg-[#cfcfd4]" />

        <motion.div
          className="h-2.5 w-2.5 rounded-full bg-[#111116]"
          animate={
            calm
              ? undefined
              : {
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }
          }
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </div>

      {/* body */}
      <motion.div
        className="relative h-[92px] w-[112px] rounded-[30px] border border-[#dcdce1] bg-white shadow-[0_18px_45px_rgba(0,0,0,0.08)]"
        animate={
          calm
            ? undefined
            : {
                rotate: [0, -1, 1, 0],
              }
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* face */}
        <div className="absolute left-1/2 top-[27px] flex -translate-x-1/2 gap-5">
          <motion.span
            className="h-3.5 w-5 rounded-full bg-[#111116]"
            animate={
              calm
                ? undefined
                : {
                    scaleY: [1, 1, 1, 0.15, 1],
                  }
            }
            transition={{
              duration: 4.5,
              repeat: Infinity,
              times: [0, 0.45, 0.88, 0.91, 1],
            }}
          />

          <motion.span
            className="h-3.5 w-5 rounded-full bg-[#111116]"
            animate={
              calm
                ? undefined
                : {
                    scaleY: [1, 1, 1, 0.15, 1],
                  }
            }
            transition={{
              duration: 4.5,
              repeat: Infinity,
              times: [0, 0.45, 0.88, 0.91, 1],
            }}
          />
        </div>

        {/* mouth */}
        <motion.div
          className="absolute bottom-[22px] left-1/2 h-1.5 w-7 -translate-x-1/2 rounded-full bg-[#111116]"
          animate={
            calm
              ? undefined
              : {
                  width: [28, 18, 28],
                }
          }
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* side arms */}
        <motion.div
          className="absolute -left-4 top-9 h-5 w-4 rounded-l-full border border-[#dcdce1] bg-white"
          animate={
            calm
              ? undefined
              : {
                  rotate: [0, -8, 0],
                }
          }
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        />

        <motion.div
          className="absolute -right-4 top-9 h-5 w-4 rounded-r-full border border-[#dcdce1] bg-white"
          animate={
            calm
              ? undefined
              : {
                  rotate: [0, 8, 0],
                }
          }
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        />
      </motion.div>

      {/* tiny status */}
      <motion.div
        className="absolute -right-9 -top-8 rounded-lg border border-[#e8e8eb] bg-white px-2 py-1 text-[8px] font-medium text-[#777780] shadow-sm"
        animate={
          calm
            ? undefined
            : {
                opacity: [0, 1, 1, 0],
                y: [4, 0, 0, -3],
              }
        }
        transition={{
          duration: 5,
          repeat: Infinity,
          times: [0, 0.12, 0.75, 1],
        }}
      >
        thinking…
      </motion.div>
    </motion.div>
  );
}

export default function KnowledgeGraph() {
  const calm = useCalm();
  const [active, setActive] = useState<string | null>(null);

  const positions = useMemo(
    () => ({
      notes: "left-[12%] top-[22%]",
      research: "right-[10%] top-[24%]",
      projects: "left-[10%] bottom-[18%]",
      docs: "right-[9%] bottom-[19%]",
    }),
    [],
  );

  return (
    <div className="relative mx-auto w-full max-w-[900px] overflow-hidden rounded-[28px] border border-[#e7e7ea] bg-[#fafafa]">
      {/* workspace */}
      <div className="relative h-[500px] overflow-hidden sm:h-[560px]">
        {/* subtle desk grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(#eeeeef 1px, transparent 1px), linear-gradient(90deg, #eeeeef 1px, transparent 1px)",
            backgroundSize: "42px 42px",
            maskImage:
              "radial-gradient(circle at center, black, transparent 72%)",
          }}
        />

        {/* header */}
        <div className="absolute left-6 right-6 top-5 z-30 flex items-center justify-between sm:left-8 sm:right-8">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#111116] text-[9px] font-bold text-white">
              V
            </span>

            <span className="text-[11px] font-medium text-[#6f6f78]">
              VaultGraph
            </span>
          </div>

          <span className="text-[10px] text-[#aaaab2]">
            your workspace
          </span>
        </div>

        {/* documents */}
        {FILES.map((file, index) => (
          <motion.div
            key={file.id}
            className={`absolute z-10 ${positions[file.id as keyof typeof positions]}`}
            initial={calm ? false : { opacity: 0, scale: 0.92 }}
            whileInView={
              calm
                ? undefined
                : {
                    opacity: 1,
                    scale: 1,
                  }
            }
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: index * 0.08,
            }}
            onMouseEnter={() => setActive(file.id)}
            onMouseLeave={() => setActive(null)}
          >
            <Document label={file.label} rotate={file.rotate} />
          </motion.div>
        ))}

        {/* connection lines */}
        <svg
          className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
          viewBox="0 0 900 500"
          preserveAspectRatio="none"
          aria-hidden
        >
          <motion.path
            d="M225 180 C320 190 330 245 390 250"
            fill="none"
            stroke={active === "notes" ? "#111116" : "#e8e8ea"}
            strokeWidth="1"
          />

          <motion.path
            d="M675 190 C580 195 565 245 510 250"
            fill="none"
            stroke={active === "research" ? "#111116" : "#e8e8ea"}
            strokeWidth="1"
          />

          <motion.path
            d="M220 390 C300 350 345 320 390 300"
            fill="none"
            stroke={active === "projects" ? "#111116" : "#e8e8ea"}
            strokeWidth="1"
          />

          <motion.path
            d="M680 390 C600 350 555 320 510 300"
            fill="none"
            stroke={active === "docs" ? "#111116" : "#e8e8ea"}
            strokeWidth="1"
          />
        </svg>

        {/* bot */}
        <Bot calm={calm} />

        {/* desk */}
        <motion.div
          className="absolute bottom-[8%] left-1/2 z-10 h-[7px] w-[250px] -translate-x-1/2 rounded-full bg-[#dedee2]"
          animate={
            calm
              ? undefined
              : {
                  scaleX: [1, 1.01, 1],
                }
          }
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        />

        {/* caption */}
        <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap text-[10px] text-[#a1a1aa]">
          Your knowledge is always being connected.
        </div>
      </div>
    </div>
  );
}
