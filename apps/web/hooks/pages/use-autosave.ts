"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveState = "saved" | "saving" | "error";

/**
 * Debounced persistence: edit -> debounce -> save -> saved.
 * - No request per keystroke (waits `delay` ms of quiet).
 * - Failed saves surface `error` without losing local edits.
 * - Stale updates can't overwrite newer content: a monotonic version
 *   counter ensures only the latest payload is sent.
 */
export function useAutosave<T>(
  save: (payload: T) => Promise<unknown>,
  delay = 800
) {
  const [state, setState] = useState<AutosaveState>("saved");
  const timer = useRef<number | undefined>(undefined);
  const version = useRef(0);
  const latest = useRef<T | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const schedule = useCallback(
    (payload: T) => {
      version.current += 1;
      const v = version.current;
      latest.current = payload;
      setState("saving");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        // Only the newest scheduled payload may fire.
        if (v !== version.current) return;
        const body = latest.current as T;
        saveRef
          .current(body)
          .then(() => {
            if (v === version.current) setState("saved");
          })
          .catch(() => {
            if (v === version.current) setState("error");
          });
      }, delay);
    },
    [delay]
  );

  const retry = useCallback(() => {
    if (latest.current !== null) schedule(latest.current);
  }, [schedule]);

  return { state, schedule, retry };
}
