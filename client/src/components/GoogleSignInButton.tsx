import { useEffect, useRef } from "react";

const GIS_SRC = "https://accounts.google.com/gsi/client";

type Props = {
  clientId: string;
  onCredential: (idToken: string) => void;
  onScriptError?: () => void;
  /** Google button copy — must match the screen (sign-in vs sign-up). */
  text?: "continue_with" | "signin_with" | "signup_with";
};

/**
 * Renders a Google Identity Services "Sign in with Google" button. Requires the same web client ID as the API.
 */
export function GoogleSignInButton({
  clientId,
  onCredential,
  onScriptError,
  text = "continue_with",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    if (!clientId.trim()) return;

    let cancelled = false;

    const init = () => {
      if (cancelled || !containerRef.current) return;
      containerRef.current.innerHTML = "";
      const w = window as unknown as {
        google?: {
          accounts: {
            id: {
              initialize: (opts: {
                client_id: string;
                callback: (c: { credential: string }) => void;
                auto_select: boolean;
              }) => void;
              renderButton: (el: HTMLElement, opts: Record<string, string | number | boolean>) => void;
            };
          };
        };
      };
      if (!w.google?.accounts?.id) return;
      w.google.accounts.id.initialize({
        client_id: clientId,
        auto_select: false,
        callback: (c) => {
          if (c.credential) onCredentialRef.current(c.credential);
        },
      });
      w.google.accounts.id.renderButton(containerRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text,
        width: 320,
      });
    };

    if ((window as unknown as { google?: unknown }).google) {
      init();
      return () => {
        cancelled = true;
      };
    }

    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", init);
      return () => {
        cancelled = true;
        existing.removeEventListener("load", init);
      };
    }

    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", init);
    script.addEventListener("error", () => onScriptError?.());
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener("load", init);
    };
  }, [clientId, onScriptError, text]);

  if (!clientId.trim()) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Google sign-in is not configured. Set <code className="rounded bg-muted px-1">VITE_GOOGLE_CLIENT_ID</code>{" "}
        to match the API.
      </p>
    );
  }

  return <div ref={containerRef} className="flex justify-center" data-testid="google-signin-container" />;
}
