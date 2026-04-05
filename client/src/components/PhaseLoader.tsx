import { cn } from "@/lib/utils";

interface PhaseLoaderProps {
  phase?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-24 h-24",
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

/** Circular ring + single caption (for global and inline loading). */
export function PhaseLoader({ phase = "Loading…", className, size = "md" }: PhaseLoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className={cn("relative flex items-center justify-center", sizeClasses[size])} aria-hidden>
        <div className={cn("absolute inset-0 rounded-full border-2 border-primary/30", sizeClasses[size])} />
        <div
          className={cn(
            "absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/60",
            "animate-[spin_0.9s_linear_infinite]",
            sizeClasses[size]
          )}
        />
      </div>
      <p
        className={cn(
          "text-muted-foreground text-center font-medium max-w-[260px] px-2",
          textSizeClasses[size]
        )}
      >
        {phase}
      </p>
    </div>
  );
}
