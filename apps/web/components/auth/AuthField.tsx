"use client";

import type { ReactNode } from "react";

type AuthFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
  inputMode?: "email" | "text";
  maxLength?: number;
  /** e.g. a show/hide password button rendered at the line's end. */
  rightSlot?: ReactNode;
};

/**
 * Editorial underline field: clean label, comfortable 16px input
 * (no iOS zoom), hairline that inks on focus, rosy note on error.
 */
export default function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  autoComplete,
  placeholder,
  inputMode,
  maxLength,
  rightSlot,
}: AuthFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="group w-full">
      <label
        htmlFor={id}
        className="block text-[13px] font-medium tracking-[-0.005em] text-muted transition-colors duration-200 group-focus-within:text-ink"
      >
        {label}
      </label>
      <div className="mt-1 flex items-center gap-2 border-b border-line pb-0 transition-colors duration-200 group-focus-within:border-ink">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete={autoComplete}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="h-12 w-full bg-transparent text-[16px] tracking-[-0.01em] text-ink placeholder:text-faint"
        />
        {rightSlot}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-[13px] leading-snug text-rosy">
          {error}
        </p>
      ) : null}
    </div>
  );
}
