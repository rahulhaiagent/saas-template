"use client";

import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/shared/theme-toggle";

function getBreadcrumb(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" / ");
}

export function DashboardHeader() {
  const pathname = usePathname();

  return (
    <header className="flex h-14 items-center gap-3 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <span className="text-sm text-muted-foreground flex-1">
        {getBreadcrumb(pathname)}
      </span>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserButton />
      </div>
    </header>
  );
}
