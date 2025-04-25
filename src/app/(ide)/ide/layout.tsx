import { IDEHeader } from "@/components/ide/ide-header";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useFileStore } from "@/store/file-store";
import { useIDEStore } from "@/store/ide-store";
import type { ReactNode } from "react";
import { useCallback } from "react";

export default function IDELayout({
	children,
	sidebar,
	editor,
	terminal,
	agent,
}: {
	children: ReactNode;
	sidebar: ReactNode;
	editor: ReactNode;
	terminal: ReactNode;
	agent: ReactNode;
}) {
	const { filteredFiles, searchQuery, loadDirectory } = useFileStore.getState();
	const { projects, activeProject, removeProject, setActiveProject } =
		useIDEStore.getState();

	const handleTabChange = useCallback(
		(projectPath: string) => {
			setActiveProject(projectPath);
			loadDirectory(projectPath, true);
		},
		[loadDirectory, setActiveProject],
	);

	const handleCloseTab = useCallback(
		(e: React.MouseEvent, projectPath: string) => {
			e.stopPropagation();
			if (projects.length <= 1) return;

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
		<div className="flex h-screen flex-col">
			<IDEHeader>
				<ResizablePanelGroup direction="horizontal" className="flex-1">
					<ResizablePanel defaultSize={20} minSize={10} collapsible>
						{sidebar}
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel defaultSize={60} minSize={30}>
						<ResizablePanelGroup direction="vertical">
							<ResizablePanel defaultSize={70} minSize={30}>
								{editor}
							</ResizablePanel>
							<ResizableHandle />
							<ResizablePanel defaultSize={30} minSize={10} collapsible>
								{terminal}
							</ResizablePanel>
						</ResizablePanelGroup>
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel defaultSize={20} minSize={10} collapsible>
						{agent}
					</ResizablePanel>
				</ResizablePanelGroup>
			</IDEHeader>
			<div className="border-slate-200 border-t bg-slate-100 px-4 text-slate-500 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
				{filteredFiles.length} items
				{searchQuery && " (filtered)"}
			</div>
		</div>
	);
}
