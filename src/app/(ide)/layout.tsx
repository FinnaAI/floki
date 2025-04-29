import { CommandDialogDemo } from "@/components/commandbar/commandbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

export default async function IDELayout({ children }: { children: ReactNode }) {
	const cookieStore = await cookies();
	const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

	return (
		<SidebarProvider className="flex h-screen flex-col overflow-hidden">
			<SidebarInset className="flex-1 overflow-hidden">
				<div className="flex h-full flex-col overflow-hidden">
					<div className="flex-1 overflow-hidden">{children}</div>
					{/* <StatusBar /> */}
				</div>
			</SidebarInset>
			<CommandDialogDemo />
		</SidebarProvider>
	);
}
