"use client";

import { useCallback, useEffect, useRef } from "react";

interface Pending {
  timer: ReturnType<typeof setTimeout>;
  run: () => void;
}

/**
 * Delays a destructive request so a toast can offer "Deshacer".
 * - `schedule(key, run)` executes `run` after `delay` ms unless `cancel(key)` is called first.
 * - Pending actions are flushed (executed) when the component unmounts, so navigating away
 *   never silently drops a confirmed action. Closing the tab within the window keeps the data.
 */
export function useDeferredAction(delay = 7000) {
  const pending = useRef(new Map<string, Pending>());

  const schedule = useCallback(
    (key: string, run: () => void) => {
      const existing = pending.current.get(key);
      if (existing) clearTimeout(existing.timer);
      const timer = setTimeout(() => {
        pending.current.delete(key);
        run();
      }, delay);
      pending.current.set(key, { timer, run });
    },
    [delay],
  );

  const cancel = useCallback((key: string) => {
    const item = pending.current.get(key);
    if (!item) return false;
    clearTimeout(item.timer);
    pending.current.delete(key);
    return true;
  }, []);

  useEffect(() => {
    const map = pending.current;
    return () => {
      map.forEach((item) => {
        clearTimeout(item.timer);
        item.run();
      });
      map.clear();
    };
  }, []);

  return { schedule, cancel };
}
