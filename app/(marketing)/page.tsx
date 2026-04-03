"use client";

import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { ShieldCheck, Database, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: ShieldCheck,
    title: "Auth out of the box",
    description:
      "Sign up, sign in, forgot password, MFA, and profile management — all powered by Clerk with zero config.",
  },
  {
    icon: Database,
    title: "Database ready",
    description:
      "Supabase PostgreSQL with Row Level Security. User profiles synced automatically via webhooks.",
  },
  {
    icon: Palette,
    title: "Beautiful UI",
    description:
      "Shadcn/UI components + Tailwind CSS. Dark mode included. Start building features immediately.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center gap-6 py-24 px-4 text-center">
        <Badge variant="secondary">SaaS Starter Template</Badge>
        <h1 className="text-5xl font-bold tracking-tight max-w-2xl">
          Ship your SaaS faster with {APP_NAME}
        </h1>
        <p className="text-xl text-muted-foreground max-w-xl">
          Auth, database, and UI all pre-configured. Clone and start building
          your product — not the plumbing.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Show
            when="signed-out"
            fallback={
              <Link
                href={ROUTES.dashboard}
                className={cn(buttonVariants({ size: "lg" }))}
              >
                Go to Dashboard
              </Link>
            }
          >
            <Link
              href={ROUTES.signUp}
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Get Started
            </Link>
            <Link
              href={ROUTES.signIn}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Sign In
            </Link>
          </Show>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
