import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, userNeedsEmailVerification } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { BrandMark } from "@/components/BrandMark";
import { useToast } from "@/hooks/use-toast";
import { ContentAreaLoader } from "@/components/ContentAreaLoader";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export default function Login() {
  const { login, loginWithGoogle, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.is_admin) {
        setLocation("/admin");
        return;
      }
      if (userNeedsEmailVerification(user)) {
        setLocation("/verify-email");
        return;
      }
      setLocation("/dashboard");
    }
  }, [authLoading, isAuthenticated, user, setLocation]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const authUser = await login(email, password);
      if (authUser.is_admin) {
        setLocation("/admin");
      } else if (userNeedsEmailVerification(authUser)) {
        setLocation("/verify-email");
      } else {
        setLocation("/dashboard");
      }
    } catch (error) {
      const description =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Sign in failed. Check your email and password.";
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    setIsSubmitting(true);
    try {
      const authUser = await loginWithGoogle(credential);
      if (authUser.is_admin) {
        setLocation("/admin");
      } else if (userNeedsEmailVerification(authUser)) {
        setLocation("/verify-email");
      } else {
        setLocation("/dashboard");
      }
    } catch (e) {
      const description =
        e instanceof Error && e.message.trim()
          ? e.message
          : "Google sign-in failed.";
      toast({ title: "Error", description, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authLoading && isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <BrandMark size="lg" artwork="favicon" />
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your LUMINI AEO account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ContentAreaLoader
            loading={isSubmitting}
            phase="Signing in…"
            minHeightClassName="min-h-[260px]"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password">
                    <a
                      className="text-sm text-primary hover:underline"
                      data-testid="link-forgot-password"
                    >
                      Forgot password?
                    </a>
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  data-testid="input-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                data-testid="button-login"
              >
                Sign in
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <GoogleSignInButton
                clientId={GOOGLE_CLIENT_ID}
                onCredential={handleGoogle}
                text="signin_with"
              />

              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/signup">
                  <a className="text-primary hover:underline" data-testid="link-signup">
                    Sign up
                  </a>
                </Link>
              </div>
            </form>
          </ContentAreaLoader>
        </CardContent>
      </Card>
    </div>
  );
}
