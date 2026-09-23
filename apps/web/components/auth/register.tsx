"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { useRegister } from "@/hooks/auth/use-register";
import { ApiError } from "@/lib/api/client";
import { useCalm } from "../landing/Reveal";
import AuthField from "./AuthField";
import AuthShell, { AuthSubmit } from "./AuthShell";
import AuthSuccess from "./AuthSuccess";
import VaultMascot, { type MascotFocus } from "./VaultMascot";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
};

function validate(
  name: string,
  email: string,
  password: string,
  confirm: string,
): Errors {
  const errors: Errors = {};

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  if (!trimmedName) {
    errors.name = "What should we call you?";
  } else if (trimmedName.length < 3) {
    errors.name = "Names are usually at least 3 characters.";
  } else if (trimmedName.length > 30) {
    errors.name = "Please keep it under 30 characters.";
  }

  if (!trimmedEmail) {
    errors.email = "Enter your email to continue.";
  } else if (!EMAIL_RE.test(trimmedEmail)) {
    errors.email = "That email address doesn't look quite right.";
  }

  if (!password) {
    errors.password = "Choose a password to secure your account.";
  } else if (password.length < 8) {
    errors.password = "Passwords should be at least 8 characters.";
  } else if (password.length > 100) {
    errors.password = "Please keep it under 100 characters.";
  }

  if (confirm !== password) {
    errors.confirm = "Those passwords don't match yet.";
  }

  return errors;
}

export default function RegisterForm() {
  const router = useRouter();
  const calm = useCalm();
  const register = useRegister();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<MascotFocus>("none");

  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const redirectTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(redirectTimer.current);
  }, []);

  const filledCount = [
    name.trim(),
    email.trim(),
    password,
    confirm,
  ].filter(Boolean).length;

  const isPasswordFocused =
    focused === "password" || focused === "confirm";

  const mood = succeeded
    ? "happy"
    : register.isPending
      ? "curious"
      : isPasswordFocused
        ? "shy"
        : filledCount > 0 || focused !== "none"
          ? "curious"
          : "sleepy";

  const passwordType = showPassword ? "text" : "password";

  const clearError = useCallback((key: keyof Errors) => {
    setErrors((previous) => {
      if (!previous[key]) return previous;
      return {
        ...previous,
        [key]: undefined,
      };
    });
  }, []);

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      clearError("name");
    },
    [clearError],
  );

  const handleEmailChange = useCallback(
    (value: string) => {
      setEmail(value);
      clearError("email");
    },
    [clearError],
  );

  const handlePasswordChange = useCallback(
    (value: string) => {
      setPassword(value);
      clearError("password");
    },
    [clearError],
  );

  const handleConfirmChange = useCallback(
    (value: string) => {
      setConfirm(value);
      clearError("confirm");
    },
    [clearError],
  );

  const handleFocus = useCallback((field: MascotFocus) => {
    setFocused(field);
  }, []);

  const handleBlur = useCallback(() => {
    setFocused("none");
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((visible) => !visible);
  }, []);

  const peekButton = useMemo(
    () => (
      <button
        type="button"
        onClick={togglePasswordVisibility}
        aria-pressed={showPassword}
        aria-label={
          showPassword ? "Hide password" : "Show password"
        }
        className="rounded-full p-2 text-stone-700 transition-colors duration-300 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
      >
        {showPassword ? (
          <EyeOff size={16} className="opacity-85" />
        ) : (
          <Eye size={16} className="opacity-85" />
        )}
      </button>
    ),
    [showPassword, togglePasswordVisibility],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (register.isPending) return;

    const nextErrors = validate(
      name,
      email,
      password,
      confirm,
    );

    setErrors(nextErrors);
    setFormError(null);

    const hasErrors = Object.values(nextErrors).some(Boolean);

    if (hasErrors) return;

    try {
      await register.mutateAsync({
        username: name.trim(),
        email: email.trim(),
        password,
      });

      setSucceeded(true);

      redirectTimer.current = window.setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 409
      ) {
        setFormError(
          "An account with this email already exists. Try signing in instead.",
        );
        return;
      }

      setFormError(
        error instanceof Error
          ? error.message
          : "Something unexpected happened. Please try again.",
      );
    }
  }

  return (
    <AuthShell>
      <motion.div
        className="flex w-full flex-col items-center"
        initial={calm ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <VaultMascot
          focus={focused}
          mood={mood}
          wiggle={0}
        />

        <h1 className="mt-8 text-center text-[clamp(28px,4.5vw,34px)] font-medium tracking-tight text-ink">
          Create your workspace
        </h1>

        <p className="mt-2 text-center text-[15px] leading-relaxed text-stone-700 font-medium">
          A quiet place for everything you know.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-8 flex w-full flex-col gap-6"
        >
          <AuthField
            id="name"
            label="Name"
            value={name}
            autoComplete="name"
            maxLength={30}
            placeholder="Ada Lovelace"
            error={errors.name}
            onFocus={() => handleFocus("name")}
            onBlur={handleBlur}
            onChange={handleNameChange}
          />

          <AuthField
            id="email"
            label="Email"
            type="email"
            value={email}
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            error={errors.email}
            onFocus={() => handleFocus("email")}
            onBlur={handleBlur}
            onChange={handleEmailChange}
          />

          <AuthField
            id="password"
            label="Password"
            type={passwordType}
            value={password}
            autoComplete="new-password"
            placeholder="8+ characters"
            error={errors.password}
            onFocus={() => handleFocus("password")}
            onBlur={handleBlur}
            onChange={handlePasswordChange}
            rightSlot={peekButton}
          />

          <AuthField
            id="confirm"
            label="Confirm password"
            type={passwordType}
            value={confirm}
            autoComplete="new-password"
            placeholder="One more time"
            error={errors.confirm}
            onFocus={() => handleFocus("confirm")}
            onBlur={handleBlur}
            onChange={handleConfirmChange}
          />

          <AnimatePresence mode="wait">
            {formError && (
              <motion.p
                key="form-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                role="alert"
                className="text-center text-[13.5px] font-medium leading-snug text-rosy"
              >
                {formError}
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {succeeded ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <AuthSuccess title="Workspace created." />
              </motion.div>
            ) : (
              <motion.div key="submit">
                <AuthSubmit
                  loading={register.isPending}
                  label="Create workspace"
                  loadingLabel="Preparing your workspace…"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <p className="mt-8 text-center text-[14px] text-stone-700 font-medium">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-ink underline decoration-stone-400 underline-offset-4 transition-all duration-300 hover:decoration-ink"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthShell>
  );
}
