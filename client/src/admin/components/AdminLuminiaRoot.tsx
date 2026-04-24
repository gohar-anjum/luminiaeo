import React, { ReactNode } from "react";
import { useTheme } from "@/hooks/useTheme";

/** Wraps admin content and applies day (light) or night (dark) theme tokens under `.luminia-admin`. */
export function AdminLuminiaRoot({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <div
      className={theme === "light" ? "luminia-admin luminia-admin--light" : "luminia-admin"}
    >
      {children}
    </div>
  );
}
