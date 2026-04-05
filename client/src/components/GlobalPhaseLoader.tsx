import { useContext } from "react";
import { useLocation } from "wouter";
import { PhaseLoader } from "@/components/PhaseLoader";
import { LoadingPhaseContext } from "@/contexts/LoadingPhaseContext";

/**
 * Legacy overlay for explicit context phases only (e.g. rare flows that still call setPhase).
 * Does not track React Query — each user page uses ContentAreaLoader on its own result area.
 * Hidden entirely on /admin/*.
 */
export function GlobalPhaseLoader() {
  const [location] = useLocation();
  const loadingContext = useContext(LoadingPhaseContext);
  const contextPhase = loadingContext?.phase ?? null;

  if (location.startsWith("/admin")) {
    return null;
  }

  if (contextPhase === null) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={`Loading: ${contextPhase}`}
    >
      <PhaseLoader phase={contextPhase} size="lg" />
    </div>
  );
}
