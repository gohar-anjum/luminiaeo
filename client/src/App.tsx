import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { UserProtectedRoute, AdminProtectedRoute } from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/AppSidebar";
import { Topbar } from "@/components/Topbar";
import { GlobalPhaseLoader } from "@/components/GlobalPhaseLoader";
import { LoadingPhaseProvider } from "@/contexts/LoadingPhaseContext";
import NotFound from "@/pages/NotFound";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

import Dashboard from "@/pages/Dashboard";
import KeywordResearch from "@/pages/KeywordResearch";
import FAQGenerator from "@/pages/FAQGenerator";
import SemanticScore from "@/pages/SemanticScore";
import ContentGenerator from "@/pages/ContentGenerator";
import AIVisibility from "@/pages/AIVisibility";
import Clustering from "@/pages/Clustering";
import PBNDetector from "@/pages/PBNDetector";
import MetaOptimizer from "@/pages/MetaOptimizer";
import Projects from "@/pages/Projects";
import Billing from "@/pages/Billing";
import BillingSuccess from "@/pages/BillingSuccess";
import BillingCancel from "@/pages/BillingCancel";
import Settings from "@/pages/Settings";
import AdminPanel from "@/admin/AdminPanel";
import { parseAdminPageParam } from "@/admin/types";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      {/* Protected Routes */}
      <Route path="/dashboard">
        <UserProtectedRoute>
          <AuthenticatedLayout>
            <Dashboard />
          </AuthenticatedLayout>
        </UserProtectedRoute>
      </Route>

      <Route path="/keyword">
        <UserProtectedRoute>
          <AuthenticatedLayout>
            <KeywordResearch />
          </AuthenticatedLayout>
        </UserProtectedRoute>
      </Route>

      <Route path="/faq">
        <UserProtectedRoute>
          <AuthenticatedLayout>
            <FAQGenerator />
          </AuthenticatedLayout>
        </UserProtectedRoute>
      </Route>

      <Route path="/semantic">
        <UserProtectedRoute>
          <AuthenticatedLayout>
            <SemanticScore />
          </AuthenticatedLayout>
        </UserProtectedRoute>
      </Route>

      <Route path="/content-generator">
        <UserProtectedRoute>
          <AuthenticatedLayout>
            <ContentGenerator />
          </AuthenticatedLayout>
        </UserProtectedRoute>
      </Route>

      <Route path="/visibility">
        <UserProtectedRoute>
          <AuthenticatedLayout>
            <AIVisibility />
          </AuthenticatedLayout>
        </UserProtectedRoute>
      </Route>

      <Route path="/clustering">
        <UserProtectedRoute>
          <AuthenticatedLayout>
            <Clustering />
          </AuthenticatedLayout>
        </UserProtectedRoute>
      </Route>

      <Route path="/pbn">
        <UserProtectedRoute>
          <AuthenticatedLayout>
            <PBNDetector />
          </AuthenticatedLayout>
        </UserProtectedRoute>
      </Route>

      <Route path="/meta">
        <UserProtectedRoute>
          <AuthenticatedLayout>
            <MetaOptimizer />
          </AuthenticatedLayout>
        </UserProtectedRoute>
      </Route>

      <Route path="/projects">
        <UserProtectedRoute>
          <AuthenticatedLayout>
            <Projects />
          </AuthenticatedLayout>
        </UserProtectedRoute>
      </Route>

      <Route path="/billing/success">
        <UserProtectedRoute>
          <AuthenticatedLayout>
            <BillingSuccess />
          </AuthenticatedLayout>
        </UserProtectedRoute>
      </Route>
      <Route path="/billing/cancel">
        <UserProtectedRoute>
          <AuthenticatedLayout>
            <BillingCancel />
          </AuthenticatedLayout>
        </UserProtectedRoute>
      </Route>
      <Route path="/billing">
        <UserProtectedRoute>
          <AuthenticatedLayout>
            <Billing />
          </AuthenticatedLayout>
        </UserProtectedRoute>
      </Route>

      <Route path="/settings">
        <UserProtectedRoute>
          <AuthenticatedLayout>
            <Settings />
          </AuthenticatedLayout>
        </UserProtectedRoute>
      </Route>

      {/* Admin Route */}
      <Route path="/admin">
        <AdminProtectedRoute>
          <div className="luminia-admin">
            <AdminPanel 
              page="dashboard" 
              onNavigate={(p) => window.location.href = `/admin/${p}`} 
            />
          </div>
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/:page">
        {(params) => (
          <AdminProtectedRoute>
            <div className="luminia-admin">
              <AdminPanel 
                page={parseAdminPageParam(params.page)} 
                onNavigate={(p) => window.location.href = `/admin/${p}`} 
              />
            </div>
          </AdminProtectedRoute>
        )}
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LoadingPhaseProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <GlobalPhaseLoader />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </LoadingPhaseProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
