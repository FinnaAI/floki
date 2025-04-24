import { IdeHeader } from "@/components/ide/ide-header";
import { GitStatusProvider, GitStatusBar } from "@/components/ide/git-status";

import type { ReactNode } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { IDESidebar } from "@/components/ide/ide-sidebar";
import { cookies } from "next/headers";

export default async function IDELayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider
      className="flex flex-col h-[100dvh] overflow-hidden"
      defaultOpen={defaultOpen}
    >
      <IdeHeader />
      <SidebarInset className="overflow-hidden h-[calc(100dvh-3rem)]">
        <div className="flex flex-row h-full overflow-hidden">
          <IDESidebar />
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
