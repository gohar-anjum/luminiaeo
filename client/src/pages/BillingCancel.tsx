import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default function BillingCancel() {
  const [, setLocation] = useLocation();

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full" data-testid="card-billing-cancel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <XCircle className="w-6 h-6" />
            Payment cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You cancelled the payment. No charges were made.
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setLocation("/billing")}
              data-testid="button-try-again"
            >
              Buy credits
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
