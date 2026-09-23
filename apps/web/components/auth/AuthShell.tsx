"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import AuthProductPanel from "./AuthProductPanel";

type AuthShellProps = {
  children: ReactNode;
};

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 font-sans antialiased">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Product side */}
        <AuthProductPanel />

        {/* Form side */}
        <section className="relative flex min-h-screen items-center justify-center border-l border-stone-200 bg-white px-6 py-16 max-lg:min-h-0 max-lg:border-l-0 max-lg:border-t max-lg:py-20">
          <div className="w-full max-w-[430px]">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

type AuthSubmitProps = {
  loading?: boolean;
  label: string;
  loadingLabel?: string;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "disabled"
>;

export function AuthSubmit({
  loading = false,
  label,
  loadingLabel = "Loading…",
  className = "",
  ...props
}: AuthSubmitProps) {
  return (
    <button
      {...props}
      type="submit"
      disabled={loading}
      className={`group relative flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-stone-900 text-[14.5px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <>
          <Loader2
            size={16}
            className="animate-spin text-stone-300"
          />
          <span className="tracking-normal">{loadingLabel}</span>
        </>
      ) : (
        <span className="tracking-normal">{label}</span>
      )}
    </button>
  );
}
