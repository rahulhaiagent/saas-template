import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/shared/logo";
import { SidebarNav } from "./sidebar-nav";

export async function AppSidebar() {
  const user = await currentUser();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Logo href="/dashboard" />
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="p-2">
        <SidebarNav />
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <UserButton />
          <div className="flex flex-col text-sm min-w-0">
            <span className="font-medium truncate">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-muted-foreground text-xs truncate">
              {user?.emailAddresses[0]?.emailAddress}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
