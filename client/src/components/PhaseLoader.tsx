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
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
};

export function PhaseLoader({ phase = "Loading…", className, size = "md" }: PhaseLoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
        {/* Rotating ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          aria-hidden
        />
        <div
          className={cn(
            "absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/60",
            "animate-[spin_0.9s_linear_infinite]",
            sizeClasses[size]
          )}
          aria-hidden
        />
        {/* Phase text inside the circle */}
        <div
          className={cn(
            "relative z-10 max-w-[70%] text-center font-medium text-foreground/90",
            textSizeClasses[size]
          )}
        >
          <span className="line-clamp-2 break-words">{phase}</span>
        </div>
      </div>
      {/* Optional label below */}
      <p className="text-muted-foreground text-sm max-w-[200px] text-center truncate" title={phase}>
        {phase}
      </p>
    </div>
  );
}
