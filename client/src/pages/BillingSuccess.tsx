import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Coins, Loader2 } from "lucide-react";
import { confirmSession } from "@/lib/api/billing";

const POLL_INTERVAL_MS = 2000;
const POLL_ATTEMPTS = 8;

export default function BillingSuccess() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"confirming" | "polling" | "done" | "error">("confirming");

  const { data: balanceData, refetch: refetchBalance } = useQuery<{ credits_balance: number }>({
    queryKey: ["/api/billing/balance"],
    retry: false,
  });
  const displayBalance = balanceData?.credits_balance;

  const sessionId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("session_id")
      : null;

  useEffect(() => {
    if (!sessionId) {
      setStatus("done");
      queryClient.invalidateQueries({ queryKey: ["/api/billing/balance"] });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setStatus("confirming");
        await confirmSession(sessionId);
        if (cancelled) return;
        setStatus("done");
        await queryClient.invalidateQueries({ queryKey: ["/api/billing/balance"] });
        const result = await refetchBalance();
        if (cancelled) return;
        const balance = result?.data?.credits_balance;
        if (balance != null && Number(balance) > 0) return;
      } catch {
        if (cancelled) return;
        setStatus("polling");
      }

      for (let i = 0; i < POLL_ATTEMPTS; i++) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        if (cancelled) return;
        try {
          await queryClient.invalidateQueries({ queryKey: ["/api/billing/balance"] });
          const result = await refetchBalance();
          if (cancelled) return;
          const balance = result?.data?.credits_balance;
          if (balance != null && Number(balance) > 0) {
            setStatus("done");
            return;
          }
        } catch {
          // ignore, retry next interval
        }
      }
      if (!cancelled) setStatus("done");
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, queryClient, refetchBalance]);

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full" data-testid="card-billing-success">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-6 h-6" />
            Payment successful
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your credits have been added to your account.
          </p>
          <p className="font-medium text-foreground">
            Purchase complete. You can close this tab and return to your work.
          </p>
          {(status === "confirming" || status === "polling") && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>
                {status === "confirming"
                  ? "Confirming your payment…"
                  : "Updating balance…"}
              </span>
            </div>
          )}
          {displayBalance != null && (
            <div className="flex items-center gap-2 text-lg">
              <Coins className="w-5 h-5" />
              <span>
                New balance: <strong>{Number(displayBalance).toLocaleString()} credits</strong>
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => window.close()}
              data-testid="button-close-tab"
            >
              Close this tab
            </Button>
            <Button
              onClick={() => setLocation("/billing")}
              data-testid="button-back-to-billing"
            >
              Back to Billing
            </Button>
            <Button variant="outline" onClick={() => setLocation("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
