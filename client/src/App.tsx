import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/AppSidebar";
import { Topbar } from "@/components/Topbar";
import NotFound from "@/pages/NotFound";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
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
import Settings from "@/pages/Settings";

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
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Dashboard />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/keyword">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <KeywordResearch />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/faq">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <FAQGenerator />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/semantic">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <SemanticScore />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/content-generator">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <ContentGenerator />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/visibility">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <AIVisibility />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/clustering">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Clustering />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/pbn">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <PBNDetector />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/meta">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <MetaOptimizer />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/projects">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Projects />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/billing">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Billing />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Settings />
          </AuthenticatedLayout>
        </ProtectedRoute>
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
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
