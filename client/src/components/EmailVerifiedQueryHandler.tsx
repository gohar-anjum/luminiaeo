import { useEffect, useRef } from "react";
import { useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

/**
 * After email verification, the API redirects to `?email_verified=1` — refresh the session and show feedback.
 */
export function EmailVerifiedQueryHandler() {
  const search = useSearch();
  const { refreshUser, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const done = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (done.current) return;
    const params = new URLSearchParams(search);
    const flag = params.get("email_verified");
    if (flag !== "1" && flag !== "true") return;
    done.current = true;

    const finish = (title: string, description: string) => {
      params.delete("email_verified");
      const q = params.toString();
      const newSearch = q ? `?${q}` : "";
      const path = window.location.pathname + newSearch;
      window.history.replaceState(null, "", path);
      toast({ title, description, variant: "default" });
    };

    if (!isAuthenticated) {
      finish("Email verified", "Sign in to continue with your account.");
      return;
    }

    void refreshUser().then(() => {
      finish("Email verified", "Your address has been confirmed.");
    });
  }, [search, isLoading, isAuthenticated, refreshUser, toast]);

  return null;
}
