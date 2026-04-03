"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, User } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ROUTES } from "@/lib/constants";

const navItems = [
  { title: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard },
  { title: "Profile", href: ROUTES.profile, icon: User },
  { title: "Settings", href: ROUTES.settings, icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            render={<Link href={item.href} />}
            isActive={pathname.startsWith(item.href)}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
