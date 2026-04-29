import { Link } from "wouter";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex min-h-24 items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="inline-flex cursor-pointer shrink-0"
          data-testid="link-home"
          aria-label="Home"
        >
          <BrandMark />
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
