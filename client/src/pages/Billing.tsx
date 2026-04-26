import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  getBalance,
  getPurchaseRules,
  getFeatures,
  createCheckout,
  buildCreditOptions,
  creditsToUsd,
  type BillingApiError,
} from "@/lib/api/billing";
import { Coins, Loader2, CreditCard, Minus, Plus } from "lucide-react";
import { ContentAreaLoader } from "@/components/ContentAreaLoader";

export default function Billing() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number | null>(null);
  const [purchaseRules, setPurchaseRules] = useState<{
    min_credits: number;
    max_credits: number;
    credit_increment: number;
    cents_per_credit: number;
  } | null>(null);
  const [features, setFeatures] = useState<{ id: string; key: string; name: string; credit_cost: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedCredits, setSelectedCredits] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setError(null);
      try {
        const [balanceRes, rulesRes, featuresRes] = await Promise.all([
          getBalance(),
          getPurchaseRules(),
          getFeatures().catch(() => []),
        ]);
        if (cancelled) return;
        setBalance(balanceRes);
        setPurchaseRules(rulesRes);
        setFeatures(Array.isArray(featuresRes) ? featuresRes : []);
        const options = buildCreditOptions(
          rulesRes.min_credits,
          rulesRes.credit_increment,
          rulesRes.max_credits
        );
        if (!selectedCredits || !options.includes(selectedCredits)) {
          setSelectedCredits(rulesRes.min_credits);
        }
      } catch (e) {
        if (cancelled) return;
        const err = e as Error & BillingApiError;
        if (err.status === 401) {
          logout();
          setLocation("/login");
          return;
        }
        setError(err.message || "Failed to load billing data");
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [setLocation, toast]);

  const handleBuyCredits = async () => {
    if (selectedCredits == null || !purchaseRules) return;
    setCheckoutLoading(true);
    setError(null);
    try {
      const { checkout_url } = await createCheckout(selectedCredits);
      window.open(checkout_url, "_blank", "noopener,noreferrer");
      return;
    } catch (e) {
      const err = e as Error & BillingApiError;
      if (err.status === 401) {
        logout();
        setLocation("/login");
        return;
      }
      const msg =
        err.message ||
        (err.status === 402
          ? "Payment error. Please try again."
          : err.status === 422
            ? "Invalid credit amount."
            : "Something went wrong.");
      setError(msg);
      toast({
        title: "Checkout failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const maxCredits = purchaseRules?.max_credits ?? 10000;
  const priceUsd =
    purchaseRules && selectedCredits != null
      ? creditsToUsd(selectedCredits, purchaseRules.cents_per_credit)
      : null;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Billing</h1>
        <p className="text-muted-foreground">
          Buy credits and manage your balance. One-time payments only.
        </p>
      </div>

      <ContentAreaLoader loading={loading} phase="Loading billing…" minHeightClassName="min-h-[320px]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 lg:mb-8">
        <Card data-testid="card-credit-balance">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              Current balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="credits-balance">
              {balance != null ? balance.toLocaleString() : "—"} credits
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-buy-credits">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Buy credits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm text-destructive" data-testid="billing-error">
                {error}
              </p>
            )}
            <div className="space-y-4">
              <label className="text-sm font-medium block">Credits</label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-10 w-10"
                  disabled={!purchaseRules || selectedCredits == null || selectedCredits <= purchaseRules.min_credits}
                  onClick={() =>
                    purchaseRules &&
                    setSelectedCredits((c) =>
                      Math.max(purchaseRules.min_credits, (c ?? purchaseRules.min_credits) - purchaseRules.credit_increment)
                    )
                  }
                  data-testid="button-decrease-credits"
                  aria-label="Decrease credits"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="flex-1 min-w-0">
                  <Slider
                    value={[selectedCredits ?? purchaseRules?.min_credits ?? 100]}
                    onValueChange={([v]) => setSelectedCredits(v)}
                    min={purchaseRules?.min_credits ?? 100}
                    max={maxCredits}
                    step={purchaseRules?.credit_increment ?? 10}
                    disabled={!purchaseRules}
                    className="w-full"
                    data-testid="slider-credits"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-10 w-10"
                  disabled={!purchaseRules || selectedCredits == null || selectedCredits >= maxCredits}
                  onClick={() =>
                    purchaseRules &&
                    setSelectedCredits((c) =>
                      Math.min(maxCredits, (c ?? purchaseRules.min_credits) + purchaseRules.credit_increment)
                    )
                  }
                  data-testid="button-increase-credits"
                  aria-label="Increase credits"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-lg font-semibold tabular-nums" data-testid="selected-credits-display">
                {selectedCredits != null ? selectedCredits.toLocaleString() : "—"} credits
              </p>
            </div>
            {priceUsd != null && (
              <p className="text-muted-foreground">
                Total: <span className="font-semibold text-foreground">${priceUsd} USD</span>
              </p>
            )}
            <Button
              className="w-full"
              onClick={handleBuyCredits}
              disabled={checkoutLoading || selectedCredits == null}
              data-testid="button-buy-credits"
            >
              {checkoutLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Pay with Stripe"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {features.length > 0 && (
        <Card data-testid="card-consumption-table">
          <CardHeader>
            <CardTitle>Credit consumption</CardTitle>
            <p className="text-sm text-muted-foreground">
              Credits charged per use for each feature.
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead className="text-right w-28">Credits per use</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {features.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {f.credit_cost}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      </ContentAreaLoader>
    </div>
  );
}
