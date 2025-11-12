import { BarChart3 } from "lucide-react";
import { Link } from "wouter";

export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">LUMINI AEO</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Professional Answer Engine Optimization platform for the AI era.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" data-testid="link-footer-features">
                  <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                    Features
                  </span>
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground" data-testid="link-footer-pricing">
                  Pricing
                </a>
              </li>
              <li>
                <Link href="/about" data-testid="link-footer-about">
                  <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                    About
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground" data-testid="link-footer-documentation">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground" data-testid="link-footer-blog">
                  Blog
                </a>
              </li>
              <li>
                <Link href="/contact" data-testid="link-footer-contact">
                  <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                    Contact
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground" data-testid="link-footer-privacy">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground" data-testid="link-footer-terms">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground text-center">
            © 2024 LUMINI AEO. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
