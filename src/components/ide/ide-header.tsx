"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFileStore } from "@/store/file-store";
import { useIDEStore } from "@/store/ide-store";
import {
	Menu,
	PanelRight,
	PanelsLeftBottom,
	Plus,
	Settings,
	X,
} from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";
import type { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";

interface IDEHeaderProps {
	children: ReactNode;
}

export function IDEHeader({ children }: IDEHeaderProps) {
	const { openNewProject, switchProject } = useFileStore();
	const {
		projects,
		activeProject,
		removeProject,
		setActiveProject,
		addProject,
	} = useIDEStore(useShallow(state => ({
		projects: state.projects,
		activeProject: state.activeProject,
		removeProject: state.removeProject,
		setActiveProject: state.setActiveProject,
		addProject: state.addProject,
	})));


	const handleOpenFolder = useCallback(async () => {
		try {
			const handle = await openNewProject();
			if (!handle) {
				console.error("No folder selected");
			}
		} catch (error) {
			console.error("Failed to open folder:", error);
		}
	}, [openNewProject]);

	const handleTabChange = useCallback(
		async (projectPath: string) => {
			console.log(`Tab change to project: ${projectPath}`);
			// First set active project (for UI tab selection)
			setActiveProject(projectPath);
			// Then perform project switch (updating file system handle and files)
			await switchProject(projectPath);
		},
		[switchProject, setActiveProject],
	);

	const handleCloseTab = useCallback(
		(e: React.MouseEvent, projectPath: string) => {
			e.stopPropagation();
			// Don't remove if it's the last project
			if (projects.length <= 1) return;

			// If removing active project, switch to another one first
			if (projectPath === activeProject) {
				const nextProject = projects.find((p) => p.path !== projectPath);
				if (nextProject) {
					handleTabChange(nextProject.path);
				}
			}
			removeProject(projectPath);
		},
		[projects, activeProject, removeProject, handleTabChange],
	);

	return (
		<div className="flex h-full flex-col overflow-hidden">
			<div className="flex items-center justify-between px-4 py-2">
				<div className="flex items-center gap-1">
					<Button variant="ghost" size="icon">
						<Menu className="h-6 w-6" />
					</Button>
					{projects.length > 0 ? (
						<Tabs
							value={activeProject || undefined}
							onValueChange={handleTabChange}
							className="w-full"
						>
							<TabsList className="mx-2 justify-start gap-1">
								{projects.map((project) => (
									<TabsTrigger
										key={project.path}
										value={project.path}
										className="flex items-center gap-1 border-none px-3"
									>
										<Button
											onClick={(e) => handleCloseTab(e, project.path)}
											className="rounded-full p-1 hover:bg-slate-200"
											variant="ghost"
										>
											<X className="h-2 w-2" />
										</Button>
										<span className="max-w-[200px] truncate">
											{project.name}
										</span>
									</TabsTrigger>
								))}
								<Button
									onClick={handleOpenFolder}
									variant="ghost"
									size="icon"
									className="rounded-full"
								>
									<Plus className="h-2 w-2" />
								</Button>
							</TabsList>
						</Tabs>
					) : (
						<Button onClick={handleOpenFolder} variant="ghost">
							<Plus className="h-3 w-3" />
							Open project
						</Button>
					)}
				</div>
				<div className="flex h-4 items-center justify-end gap-2">
					<div className="mr-2 flex items-center gap-2 text-muted-foreground">
						<Link href="#">
							<PanelsLeftBottom className="h-5 w-5" />
						</Link>
						<Link href="#">
							<PanelRight className="h-5 w-5" />
						</Link>
						<Link href="#">
							<Settings className="h-5 w-5" />
						</Link>
					</div>

					<Separator orientation="vertical" />
					<Button variant="ghost" className="p-2">
						<Avatar className="h-6 w-6">
							<AvatarImage src="https://github.com/hamedmp.png" />
							<AvatarFallback>HM</AvatarFallback>
						</Avatar>
						<span className="text-sm">Hamed</span>
					</Button>
				</div>
			</div>
			{projects.length > 0 ? (
				<div className="flex-1 overflow-hidden">
					{activeProject && children}
				</div>
			) : (
				<div className="flex h-[calc(100vh-4rem)] items-center justify-center">
					<div className="text-center">
						<h3 className="mb-4 font-medium text-lg">No Project Open</h3>
						<Button onClick={handleOpenFolder} variant="outline">
							Open a Folder
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
