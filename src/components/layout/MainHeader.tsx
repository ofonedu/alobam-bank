
"use client";

import Link from "next/link";
import { AppLogo } from "./AppLogo";
import { UserNav } from "./UserNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "./ThemeToggle";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import type { NavLinkItem, MainHeaderProps } from "@/types";

const defaultNavLinks: NavLinkItem[] = [
  { href: "#personal", label: "Personal" },
  { href: "#business", label: "Business" },
  { href: "#about-us", label: "About Us" },
  { href: "#support", label: "Help & Support" },
];

export function MainHeader({ navLinks: dynamicNavLinks }: MainHeaderProps) {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const linksToRender = (dynamicNavLinks && dynamicNavLinks.length > 0) ? dynamicNavLinks : defaultNavLinks;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <AppLogo />
        <nav className="hidden md:flex items-center space-x-6 ml-10">
          {linksToRender.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
          <ThemeToggle />
          {loading ? (
            <div className="h-8 w-32 animate-pulse rounded-md bg-muted"></div>
          ) : user ? (
            <UserNav />
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="bg-secondary text-primary-foreground hover:bg-secondary/90">
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-background">
                <div className="p-6">
                  <div className="mb-6">
                    <AppLogo />
                  </div>
                  <nav className="flex flex-col space-y-4">
                    {linksToRender.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="text-base font-medium text-foreground hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                     {!user && !loading && (
                       <>
                        <hr className="my-2 border-border" />
                        <Link
                            href="/login"
                            className="text-base font-medium text-foreground hover:text-primary"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Login
                          </Link>
                       </>
                     )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
