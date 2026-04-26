import { useAuth, userNeedsEmailVerification } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { PhaseLoader } from "@/components/PhaseLoader";

type ProtectedRouteProps = {
  children: React.ReactNode;
  /** Only admins may access (others go to `/dashboard`). */
  requireAdmin?: boolean;
  /** Admins are redirected to `/admin` (main app shell is for non-admins only). */
  forbidAdmin?: boolean;
};

export function ProtectedRoute({
  children,
  requireAdmin,
  forbidAdmin,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    if (forbidAdmin && !requireAdmin && user && userNeedsEmailVerification(user) && !user.is_admin) {
      setLocation("/verify-email");
      return;
    }
    if (requireAdmin && !user?.is_admin) {
      setLocation("/dashboard");
      return;
    }
    if (forbidAdmin && user?.is_admin) {
      setLocation("/admin");
    }
  }, [isAuthenticated, isLoading, user, requireAdmin, forbidAdmin, setLocation]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] w-full flex-1 items-center justify-center p-8">
        <PhaseLoader phase="Checking authentication…" size="md" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (forbidAdmin && !requireAdmin && user && userNeedsEmailVerification(user) && !user.is_admin) {
    return (
      <div className="flex min-h-[50vh] w-full flex-1 items-center justify-center p-8">
        <PhaseLoader phase="Email verification required…" size="md" />
      </div>
    );
  }

  if (requireAdmin && !user?.is_admin) {
    return null;
  }

  if (forbidAdmin && user?.is_admin) {
    return null;
  }

  return <>{children}</>;
}

/** Authenticated non-admin routes only (main product UI). */
export function UserProtectedRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute forbidAdmin>{children}</ProtectedRoute>;
}

/** Admin panel only (`user.is_admin`). */
export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requireAdmin>{children}</ProtectedRoute>;
}
