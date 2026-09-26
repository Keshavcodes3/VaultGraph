"use client";

import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLogin } from "@/hooks/auth/use-login";
import { ApiError } from "@/lib/api/client";
import { useCalm } from "../landing/Reveal";
import AuthField from "./AuthField";
import AuthShell, { AuthSubmit } from "./AuthShell";
import AuthSuccess from "./AuthSuccess";
import VaultMascot, { type MascotFocus } from "./VaultMascot";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string) {
  const errors: { email?: string; password?: string } = {};
  if (!email.trim()) errors.email = "Enter your email to continue.";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "That email doesn't look quite right.";
  if (!password) errors.password = "Enter your password to continue.";
  else if (password.length < 8) errors.password = "Passwords are at least 8 characters.";
  return errors;
}

export default function LoginForm() {
  const router = useRouter();
  const calm = useCalm();
  const login = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<MascotFocus>("none");
  const [wiggle, setWiggle] = useState(0);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const redirectTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(redirectTimer.current);
  }, []);

  // Looks toward email, covers its eyes on password,
  // leans in while loading, celebrates on success.
  const mood = succeeded
    ? "happy"
    : login.isPending
      ? "curious"
      : focused === "password"
        ? "shy"
        : "calm";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (login.isPending) return;

    const next = validate(email, password);
    setErrors(next);
    setFormError(null);
    if (next.email || next.password) return;

    try {
      await login.mutateAsync({ email: email.trim(), password });
      // Let the success animation play before leaving.
      setSucceeded(true);
      redirectTimer.current = window.setTimeout(() => router.push("/workspace"), 900);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFormError("That email and password don't match. Want to try again?");
      } else {
        setFormError(err instanceof Error ? err.message : "Something went wrong.");
      }
    }
  }

  return (
    <AuthShell>
      <motion.div
        className="flex w-full flex-col items-center"
        {...(calm
          ? {}
          : {
              initial: { opacity: 0, y: 16 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
            })}
      >
        <VaultMascot focus={focused} mood={mood} wiggle={wiggle} />

        <h1 className="mt-8 text-center text-[clamp(30px,5vw,36px)] leading-[1.1] font-semibold tracking-[-0.03em]">
          Welcome back.
        </h1>
        <p className="mt-2.5 text-center text-[15.5px] leading-relaxed text-ink-soft">
          Your workspace is waiting.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-10 flex w-full flex-col gap-7">
          <AuthField
            id="email"
            label="Email"
            type="email"
            value={email}
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            error={errors.email}
            onFocus={() => setFocused("email")}
            onBlur={() => setFocused("none")}
            onChange={(v) => {
              setEmail(v);
              setWiggle((w) => w + 1);
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
            }}
          />

          <div>
            <AuthField
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused("none")}
              onChange={(v) => {
                setPassword(v);
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              }}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="rounded-full p-2 text-faint transition-colors duration-200 hover:text-ink"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              }
            />
            <div className="mt-3 flex justify-end">
              <a
                href="/forgot-password"
                className="text-[13.5px] font-medium text-ink-soft transition-colors duration-200 hover:text-ink"
              >
                Forgot password?
              </a>
            </div>
          </div>

          {formError ? (
            <p role="alert" className="text-center text-[13.5px] leading-snug text-rosy">
              {formError}
            </p>
          ) : null}

          {succeeded ? (
            <AuthSuccess title="Welcome back." redirectTo="/workspace" />
          ) : (
            <AuthSubmit
              loading={login.isPending}
              label="Continue"
              loadingLabel="Opening…"
            />
          )}
        </form>

        <p className="mt-8 text-center text-[14px] text-ink-soft">
          Don&apos;t have an account?{" "}
          <a
            href="/register"
            className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors duration-200 hover:decoration-ink"
          >
            Create one
          </a>
        </p>
      </motion.div>
    </AuthShell>
  );
}
