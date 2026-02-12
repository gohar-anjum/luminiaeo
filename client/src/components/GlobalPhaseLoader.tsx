import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating, useQueryClient } from "@tanstack/react-query";
import { PhaseLoader } from "@/components/PhaseLoader";
import { getPhaseForQueryKey, getPhaseForMutationKey } from "@/lib/loadingPhases";
import { useContext } from "react";
import { LoadingPhaseContext } from "@/contexts/LoadingPhaseContext";

function getCurrentPhase(queryClient: ReturnType<typeof useQueryClient>): string {
  const queryCache = queryClient.getQueryCache();
  const mutationCache = queryClient.getMutationCache();

  const fetchingQueries = queryCache.getAll().filter((q) => q.state.fetchStatus === "fetching");
  if (fetchingQueries.length > 0) {
    const query = fetchingQueries[0];
    const meta = query.options.meta as { phase?: string } | undefined;
    if (meta?.phase) return meta.phase;
    return getPhaseForQueryKey(query.queryKey);
  }

  const pendingMutations = mutationCache.getAll().filter((m) => m.state.status === "pending");
  if (pendingMutations.length > 0) {
    const mutation = pendingMutations[0];
    const meta = mutation.meta as { phase?: string } | undefined;
    if (meta?.phase) return meta.phase;
    return getPhaseForMutationKey(mutation.mutationKey || []);
  }

  return "Loading…";
}

export function GlobalPhaseLoader() {
  const queryClient = useQueryClient();
  const loadingContext = useContext(LoadingPhaseContext);
  const contextPhase = loadingContext?.phase ?? null;
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const [queryPhase, setQueryPhase] = useState("Loading…");

  const isQueryLoading = isFetching > 0 || isMutating > 0;
  const isLoading = contextPhase !== null || isQueryLoading;

  useEffect(() => {
    if (!isQueryLoading) return;

    const updatePhase = () => setQueryPhase(getCurrentPhase(queryClient));

    updatePhase();

    const unsubQuery = queryClient.getQueryCache().subscribe(updatePhase);
    const unsubMutation = queryClient.getMutationCache().subscribe(updatePhase);

    return () => {
      unsubQuery();
      unsubMutation();
    };
  }, [queryClient, isQueryLoading]);

  if (!isLoading) return null;

  const phase = contextPhase ?? queryPhase;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={`Loading: ${phase}`}
    >
      <PhaseLoader phase={phase} size="lg" />
    </div>
  );
}
