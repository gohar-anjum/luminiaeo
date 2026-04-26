import { useEffect } from "react";
import { useLocation } from "wouter";
import { EMAIL_UNVERIFIED_EVENT } from "@/lib/api/emailUnverified";

/**
 * On API 403 + EMAIL_UNVERIFIED, the backend fires a global event; we route to the verify screen.
 */
export function EmailUnverifiedListener() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const onUnverified = () => {
      if (location === "/verify-email") return;
      setLocation("/verify-email");
    };
    window.addEventListener(EMAIL_UNVERIFIED_EVENT, onUnverified);
    return () => window.removeEventListener(EMAIL_UNVERIFIED_EVENT, onUnverified);
  }, [location, setLocation]);

  return null;
}
