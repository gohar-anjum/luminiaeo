import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Mail, LogOut, RefreshCw } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, userNeedsEmailVerification } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ContentAreaLoader } from "@/components/ContentAreaLoader";
import { PhaseLoader } from "@/components/PhaseLoader";

export default function VerifyEmail() {
  const { user, isAuthenticated, isLoading, logout, resendVerificationEmail, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [resendBusy, setResendBusy] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    if (user && (user.is_admin || !userNeedsEmailVerification(user))) {
      setLocation("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  const onResend = async () => {
    setResendBusy(true);
    try {
      await resendVerificationEmail();
      toast({
        title: "Check your inbox",
        description: "If you still need a link, we sent another verification email.",
      });
    } catch (e) {
      const message =
        e instanceof Error && e.message
          ? e.message
          : e &&
              typeof e === "object" &&
              "message" in e &&
              typeof (e as { message: string }).message === "string"
            ? (e as { message: string }).message
            : "Could not send a new email. Try again later.";
      toast({ title: "Request failed", description: message, variant: "destructive" });
    } finally {
      setResendBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <PhaseLoader phase="Loading…" size="md" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (user.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <BrandMark />
          </div>
          <div>
            <CardTitle className="text-2xl">Verify your email</CardTitle>
            <CardDescription>
              We sent a link to <span className="font-medium text-foreground">{user.email}</span>. Open it to
              unlock your account.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ContentAreaLoader
            loading={resendBusy}
            phase="Sending…"
            minHeightClassName="min-h-[200px]"
          >
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                <Mail className="h-4 w-4" />
                Didn’t get the message?
              </div>
              <p className="text-left leading-relaxed">
                Check spam, then use “Resend” below. The link must be opened in this browser or you can sign
                in again on any device.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button onClick={onResend} disabled={resendBusy} className="w-full sm:w-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend verification email
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void refreshUser();
                }}
                className="w-full sm:w-auto"
              >
                I already verified
              </Button>
            </div>

            <div className="pt-2 text-center">
              <Button variant="ghost" className="text-muted-foreground" onClick={() => void logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </ContentAreaLoader>
        </CardContent>
      </Card>
    </div>
  );
}
