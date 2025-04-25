import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	SidebarTrigger,
} from "@/components/ui/sidebar";

import { File, GitBranchIcon, Home, Settings } from "lucide-react";

export async function IDESidebar() {
	const items = [
		{
			title: "Home",
			url: "#",
			icon: Home,
		},
		{
			title: "Files",
			url: "#",
			icon: File,
		},
		{
			title: "Git",
			url: "#",
			icon: GitBranchIcon,
		},
		{
			title: "Settings",
			url: "#",
			icon: Settings,
		},
	];
	return (
		<Sidebar variant="sidebar" collapsible="icon">
			<SidebarHeader>
				<SidebarTrigger />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Main</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild>
										<a href={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarGroup>
					<SidebarGroupLabel>Files</SidebarGroupLabel>
				</SidebarGroup>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
