import { BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer" data-testid="link-home">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">LUMINI AEO</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" data-testid="link-nav-home">
            <span className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors cursor-pointer">
              Home
            </span>
          </Link>
          <Link href="/about" data-testid="link-nav-about">
            <span className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors cursor-pointer">
              About
            </span>
          </Link>
          <Link href="/contact" data-testid="link-nav-contact">
            <span className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors cursor-pointer">
              Contact
            </span>
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" data-testid="button-login">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button data-testid="button-signup">Sign up</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
