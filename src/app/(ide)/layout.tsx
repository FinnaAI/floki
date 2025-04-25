import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

export default async function IDELayout({ children }: { children: ReactNode }) {
	const cookieStore = await cookies();
	const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

	return (
		<SidebarProvider
			className="flex h-[100dvh] flex-col overflow-hidden"
			defaultOpen={defaultOpen}
		>
			{/* <IdeHeader /> */}
			<SidebarInset className="h-[calc(100dvh-3rem)] overflow-hidden">
				<div className="flex h-full flex-row overflow-hidden">
					{/* <IDESidebar /> */}
					<div className="flex-1 overflow-hidden">{children}</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
