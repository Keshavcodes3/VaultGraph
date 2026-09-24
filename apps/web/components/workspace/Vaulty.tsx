"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  ChevronRight,
  FileText,
  Link2,
  Network,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ChatMsg } from "./data";
import { SUGGESTIONS } from "./data";

/* -------------------------------------------------------------------------- */
/* Vaulty                                                                      */
/* -------------------------------------------------------------------------- */

export function VaultyMark({
  size = 30,
  animated = false,
}: {
  size?: number;
  animated?: boolean;
}) {
  return (
    <motion.div
      style={{ width: size, height: size }}
      animate={
        animated
          ? {
              y: [0, -2, 0],
            }
          : undefined
      }
      transition={
        animated
          ? {
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : undefined
      }
      className="relative flex shrink-0 items-center justify-center rounded-[10px] bg-ink shadow-[0_3px_12px_rgba(0,0,0,0.12)]"
      aria-hidden="true"
    >
      <svg
        width={size * 0.68}
        height={size * 0.68}
        viewBox="0 0 32 32"
        fill="none"
      >
        {/* graph connections */}

        <path
          d="M7 8.5 16 24 25 8.5"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />

        <path
          d="M7 8.5h18"
          stroke="white"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.28"
        />

        {/* nodes */}

        <circle cx="7" cy="8.5" r="3" fill="white" />
        <circle cx="25" cy="8.5" r="3" fill="white" />

        <circle
          cx="16"
          cy="24"
          r="4"
          fill="#4f46e5"
          stroke="white"
          strokeWidth="1.5"
        />

        {/* tiny core */}

        <circle cx="16" cy="24" r="1.2" fill="white" />
      </svg>

      {animated && (
        <motion.span
          animate={{
            opacity: [0.15, 0.45, 0.15],
            scale: [0.8, 1.15, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-[10px] ring-1 ring-brand"
        />
      )}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const THINKING_STATES = [
  "looking through your workspace",
  "following the graph",
  "connecting the dots",
  "checking the source",
];

function MessageSource({ source }: { source: string }) {
  return (
    <button
      type="button"
      className="group flex max-w-full items-center gap-2 rounded-lg border border-line/70 bg-soft/70 px-2.5 py-2 text-left transition-all hover:border-ink/20 hover:bg-soft"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-faint shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <FileText size={12} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-medium text-ink-soft group-hover:text-ink">
          {source}
        </span>

        <span className="mt-0.5 flex items-center gap-1 font-mono text-[8px] uppercase tracking-wider text-faint">
          <Link2 size={8} />
          source
        </span>
      </span>

      <ChevronRight
        size={12}
        className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
}

function Suggestion({
  children,
  icon,
  onClick,
}: {
  children: ReactNode;
  icon?: ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex w-full items-center gap-2.5 rounded-[9px] border border-line/70 bg-white px-3 py-2.5 text-left transition-colors hover:border-ink/20 hover:bg-soft"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-soft text-faint transition-colors group-hover:text-ink">
        {icon ?? <Sparkles size={12} />}
      </span>

      <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink-soft group-hover:text-ink">
        {children}
      </span>

      <ChevronRight
        size={12}
        className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5"
      />
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export default function Vaulty({
  messages,
  typing,
  pendingQuote,
  onSend,
  onClearQuote,
}: {
  messages: ChatMsg[];
  typing: boolean;
  pendingQuote: string | null;
  onSend: (text: string) => void;
  onClearQuote: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ------------------------------------------------------------------------ */
  /* Thinking state                                                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!typing) {
      setThinking(0);
      return;
    }

    const interval = window.setInterval(() => {
      setThinking((value) => (value + 1) % THINKING_STATES.length);
    }, 850);

    return () => window.clearInterval(interval);
  }, [typing]);

  /* ------------------------------------------------------------------------ */
  /* Scroll                                                                    */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages.length, typing]);

  /* ------------------------------------------------------------------------ */
  /* Composer                                                                  */
  /* ------------------------------------------------------------------------ */

  const submit = () => {
    const value = draft.trim();

    if (!value || typing) return;

    onSend(value);
    setDraft("");
    onClearQuote();

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);

    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleSuggestion = (value: string) => {
    if (typing) return;

    onSend(value);
  };

  const showWelcome = messages.length === 0;

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-white">
      {/* ================================================================== */}
      {/* HEADER                                                             */}
      {/* ================================================================== */}

      <header className="relative flex shrink-0 items-center gap-3 border-b border-line/80 px-4 py-3">
        <div className="relative">
          <VaultyMark size={30} animated={typing} />

          <motion.span
            animate={
              typing
                ? {
                    scale: [1, 1.25, 1],
                    opacity: [0.7, 1, 0.7],
                  }
                : undefined
            }
            transition={
              typing
                ? {
                    duration: 1.4,
                    repeat: Infinity,
                  }
                : undefined
            }
            className={[
              "absolute -bottom-0.5 -right-0.5",
              "h-2.5 w-2.5 rounded-full border-2 border-white",
              typing ? "bg-brand" : "bg-mint",
            ].join(" ")}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-ink">
              Vaulty
            </h2>

            <span className="rounded-full border border-line px-1.5 py-[1px] font-mono text-[8px] uppercase tracking-wider text-faint">
              companion
            </span>
          </div>

          <div className="relative mt-0.5 h-3 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={typing ? THINKING_STATES[thinking] : "idle"}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.16 }}
                className="truncate font-mono text-[9.5px] text-faint"
              >
                {typing
                  ? THINKING_STATES[thinking]
                  : "your workspace, understood"}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-soft text-faint">
          <Network size={13} strokeWidth={1.7} />
        </div>
      </header>

      {/* ================================================================== */}
      {/* CONTENT                                                            */}
      {/* ================================================================== */}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {showWelcome ? (
          /* ---------------------------------------------------------------- */
          /* EMPTY / WELCOME                                                 */
          /* ---------------------------------------------------------------- */

          <div className="flex min-h-full flex-col px-4 py-6">
            <div className="flex flex-1 flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <VaultyMark size={42} animated />

                <h3 className="mt-4 text-[21px] font-semibold tracking-[-0.035em] text-ink">
                  What are we
                  <br />
                  looking for?
                </h3>

                <p className="mt-2 max-w-[260px] text-[12px] leading-[1.65] text-ink-soft">
                  Ask about anything inside your workspace. Vaulty follows
                  pages, connections and sources instead of guessing.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.35 }}
                className="mt-7 space-y-1.5"
              >
                {SUGGESTIONS.slice(0, 4).map((suggestion, index) => (
                  <Suggestion
                    key={suggestion}
                    onClick={() => handleSuggestion(suggestion)}
                    icon={
                      index === 0 ? (
                        <SearchIcon />
                      ) : index === 1 ? (
                        <Network size={12} />
                      ) : index === 2 ? (
                        <FileText size={12} />
                      ) : (
                        <Sparkles size={12} />
                      )
                    }
                  >
                    {suggestion}
                  </Suggestion>
                ))}
              </motion.div>
            </div>

            <p className="pt-6 text-center font-mono text-[8.5px] uppercase tracking-[0.12em] text-faint">
              grounded in your workspace
            </p>
          </div>
        ) : (
          /* ---------------------------------------------------------------- */
          /* MESSAGES                                                         */
          /* ---------------------------------------------------------------- */

          <div className="px-4 py-5">
            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((message) => {
                  const isUser = message.role === "user";

                  if (isUser) {
                    return (
                      <motion.div
                        key={message.id}
                        initial={{
                          opacity: 0,
                          y: 8,
                          scale: 0.98,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                        }}
                        transition={{
                          duration: 0.22,
                          ease: "easeOut",
                        }}
                        className="flex justify-end"
                      >
                        <div className="max-w-[86%]">
                          <div className="rounded-[14px] rounded-br-[4px] bg-ink px-3.5 py-2.5 text-[12.5px] leading-[1.65] text-white">
                            {message.content}
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={message.id}
                      initial={{
                        opacity: 0,
                        y: 8,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.22,
                        ease: "easeOut",
                      }}
                      className="flex items-start gap-2.5"
                    >
                      <VaultyMark size={25} />

                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-ink">
                            Vaulty
                          </span>

                          <span className="font-mono text-[8px] uppercase tracking-wider text-faint">
                            found this
                          </span>
                        </div>

                        <div className="text-[12.5px] leading-[1.7] text-ink">
                          {message.content}
                        </div>

                        {message.sources &&
                          message.sources.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-faint">
                                  Connected sources
                                </span>

                                <span className="h-px flex-1 bg-line" />
                              </div>

                              {message.sources.map((source) => (
                                <MessageSource
                                  key={source}
                                  source={source}
                                />
                              ))}
                            </div>
                          )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* THINKING */}

              <AnimatePresence>
                {typing && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-start gap-2.5"
                  >
                    <VaultyMark size={25} animated />

                    <div className="pt-1">
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((index) => (
                          <motion.span
                            key={index}
                            animate={{
                              y: [0, -3, 0],
                              opacity: [0.25, 0.9, 0.25],
                            }}
                            transition={{
                              duration: 0.9,
                              repeat: Infinity,
                              delay: index * 0.14,
                              ease: "easeInOut",
                            }}
                            className="h-1.5 w-1.5 rounded-full bg-ink"
                          />
                        ))}

                        <span className="ml-1 font-mono text-[8.5px] text-faint">
                          {THINKING_STATES[thinking]}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef} />
            </div>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* COMPOSER                                                           */}
      {/* ================================================================== */}

      <div className="shrink-0 border-t border-line/80 bg-white p-3">
        <AnimatePresence initial={false}>
          {pendingQuote && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
                y: 4,
              }}
              animate={{
                opacity: 1,
                height: "auto",
                y: 0,
              }}
              exit={{
                opacity: 0,
                height: 0,
                y: 4,
              }}
              className="overflow-hidden"
            >
              <div className="mb-2 flex items-start gap-2 rounded-[9px] bg-soft px-2.5 py-2">
                <div className="mt-0.5 h-7 w-[2px] shrink-0 rounded-full bg-brand" />

                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-faint">
                    Looking at
                  </p>

                  <p className="mt-0.5 truncate text-[11px] text-ink-soft">
                    “{pendingQuote}”
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClearQuote}
                  aria-label="Clear selected text"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-faint hover:bg-white hover:text-ink"
                >
                  <X size={11} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={[
            "group relative rounded-[11px] border bg-white",
            "transition-all duration-150",
            "focus-within:border-ink/30",
            "focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.06)]",
            typing
              ? "border-line"
              : "border-line hover:border-ink/20",
          ].join(" ")}
        >
          <textarea
            ref={textareaRef}
            value={draft}
            disabled={typing}
            rows={1}
            placeholder={
              pendingQuote
                ? "Ask about this..."
                : "Ask Vaulty anything..."
            }
            onChange={(event) => handleDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }

              if (event.key === "Escape") {
                onClearQuote();
              }
            }}
            className="block max-h-[120px] min-h-[42px] w-full resize-none border-none bg-transparent px-3.5 pb-10 pt-3 text-[12.5px] leading-[1.6] text-ink outline-none placeholder:text-faint focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
          />

          <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-center justify-between">
            <span className="hidden font-mono text-[8px] text-faint sm:block">
              ↵ send · ⇧↵ newline
            </span>

            <span className="sm:hidden" />

            <motion.button
              type="button"
              whileHover={
                draft.trim() && !typing
                  ? {
                      scale: 1.04,
                    }
                  : undefined
              }
              whileTap={
                draft.trim() && !typing
                  ? {
                      scale: 0.94,
                    }
                  : undefined
              }
              onClick={submit}
              disabled={!draft.trim() || typing}
              aria-label="Send message"
              className={[
                "flex h-7 w-7 items-center justify-center rounded-[7px]",
                "transition-all duration-150",
                draft.trim() && !typing
                  ? "bg-ink text-white shadow-[0_2px_6px_rgba(0,0,0,0.15)] hover:bg-brand"
                  : "bg-soft text-faint",
              ].join(" ")}
            >
              <ArrowUp size={14} strokeWidth={2} />
            </motion.button>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-mint" />

          <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-faint">
            VaultGraph workspace context
          </span>
        </div>
      </div>
    </aside>
  );
}

function SearchIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="7"
        cy="7"
        r="4.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="m10.5 10.5 3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
