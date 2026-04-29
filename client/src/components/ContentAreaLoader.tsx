import { cn } from "@/lib/utils";
import { PhaseLoader } from "@/components/PhaseLoader";

type ContentAreaLoaderProps = {
  loading: boolean;
  phase?: string;
  children: React.ReactNode;
  className?: string;
  /** Applied to the wrapper for minimum height while loading */
  minHeightClassName?: string;
};

/**
 * Standard user-panel loading: overlays only this region (not the full viewport).
 * Use one per logical result block to avoid double loaders (do not combine with GlobalPhaseLoader for the same fetch).
 */
export function ContentAreaLoader({
  loading,
  phase = "Loading…",
  children,
  className,
  minHeightClassName = "min-h-[200px]",
}: ContentAreaLoaderProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-6",
        loading ? minHeightClassName : undefined,
        className,
      )}
    >
      {children}
      {loading ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-[1px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={phase}
        >
          <PhaseLoader phase={phase} size="md" />
        </div>
      ) : null}
    </div>
  );
}
