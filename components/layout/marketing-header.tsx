"use client";

import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  return (
    <header className="border-b">
      <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-4">
        <Logo />

        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Show
            when="signed-out"
            fallback={
              <Link
                href={ROUTES.dashboard}
                className={cn(buttonVariants({ variant: "ghost" }))}
              >
                Dashboard
              </Link>
            }
          >
            <Link
              href={ROUTES.signIn}
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              Sign In
            </Link>
            <Link href={ROUTES.signUp} className={cn(buttonVariants())}>
              Get Started
            </Link>
          </Show>
        </nav>
      </div>
    </header>
  );
}
