import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useAuth, userNeedsEmailVerification } from "@/hooks/useAuth";
import { getPasswordStrength } from "@/utils/validations";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { BrandMark } from "@/components/BrandMark";
import { ContentAreaLoader } from "@/components/ContentAreaLoader";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export default function Signup() {
  const { signup, loginWithGoogle, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const passwordStrength = getPasswordStrength(formData.password);

  const handleGoogle = async (credential: string) => {
    setIsLoading(true);
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
          : "Google sign-up failed.";
      toast({ title: "Error", description, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!acceptTerms) {
      toast({
        title: "Error",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await signup(formData.name, formData.email, formData.password, formData.confirmPassword);
      toast({
        title: "Check your email",
        description: "We sent a verification link. You can resend it from the next screen if needed.",
        variant: "default",
      });
      setLocation("/verify-email");
    } catch (error) {
      const description =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Failed to create an account. Please try again.";
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>
              Start optimizing for AI search engines today
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ContentAreaLoader
            loading={isLoading}
            phase="Creating your account…"
            minHeightClassName="min-h-[420px]"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="John Doe"
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="your@email.com"
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Create a strong password"
                data-testid="input-password"
              />
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Password strength:</span>
                    <span className={`font-medium ${
                      passwordStrength.score < 50 ? "text-destructive" :
                      passwordStrength.score < 70 ? "text-warning" : "text-success"
                    }`} data-testid="text-password-strength">
                      {passwordStrength.label}
                    </span>
                  </div>
                  <Progress
                    value={passwordStrength.score}
                    className={`h-2 ${passwordStrength.color}`}
                    data-testid="progress-password-strength"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                placeholder="Confirm your password"
                data-testid="input-confirm-password"
              />
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                className="mt-1"
                data-testid="checkbox-terms"
              />
              <Label
                htmlFor="terms"
                className="text-sm font-normal leading-relaxed cursor-pointer"
              >
                I agree to the{" "}
                <a href="#" className="text-primary hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-signup"
            >
              Create account
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
              text="signup_with"
            />

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login">
                <a className="text-primary hover:underline" data-testid="link-login">
                  Sign in
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
