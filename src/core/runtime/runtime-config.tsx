"use client";

import { createContext, useContext } from "react";

export interface RuntimeConfig {
  /** Every BFF module answers from the mock server (demo mode). See `config/api-modes.ts`. */
  mockOnly: boolean;
}

/** Server-only settings the client needs, resolved by the panel layout (never read from env in the browser). */
const RuntimeConfigContext = createContext<RuntimeConfig>({ mockOnly: true });

export function RuntimeConfigProvider({ value, children }: { value: RuntimeConfig; children: React.ReactNode }) {
  return <RuntimeConfigContext.Provider value={value}>{children}</RuntimeConfigContext.Provider>;
}

export const useRuntimeConfig = () => useContext(RuntimeConfigContext);
