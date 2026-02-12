import { createContext, useContext, useState, useCallback } from "react";

type LoadingPhaseContextType = {
  phase: string | null;
  setPhase: (phase: string | null) => void;
};

export const LoadingPhaseContext = createContext<LoadingPhaseContextType | undefined>(undefined);

export function LoadingPhaseProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhaseState] = useState<string | null>(null);
  const setPhase = useCallback((p: string | null) => setPhaseState(p), []);
  return (
    <LoadingPhaseContext.Provider value={{ phase, setPhase }}>
      {children}
    </LoadingPhaseContext.Provider>
  );
}

export function useLoadingPhase() {
  const ctx = useContext(LoadingPhaseContext);
  if (ctx === undefined) {
    throw new Error("useLoadingPhase must be used within LoadingPhaseProvider");
  }
  return ctx;
}
