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
	const { loadDirectory } = useFileStore.getState();
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
		<div className="flex h-full flex-col overflow-hidden">
			<IDEHeader>
				<ResizablePanelGroup
					direction="horizontal"
					className="h-full overflow-hidden"
				>
					<ResizablePanel
						defaultSize={20}
						minSize={10}
						collapsible
						className="overflow-hidden"
					>
						{sidebar}
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel
						defaultSize={60}
						minSize={30}
						className="overflow-hidden"
					>
						<ResizablePanelGroup
							direction="vertical"
							className="h-full overflow-hidden"
						>
							<ResizablePanel
								defaultSize={70}
								minSize={30}
								className="overflow-hidden"
							>
								{editor}
							</ResizablePanel>
							<ResizableHandle />
							<ResizablePanel
								defaultSize={30}
								minSize={10}
								collapsible
								className="overflow-hidden"
							>
								{terminal}
							</ResizablePanel>
						</ResizablePanelGroup>
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel
						defaultSize={20}
						minSize={10}
						collapsible
						className="overflow-hidden"
					>
						{agent}
					</ResizablePanel>
				</ResizablePanelGroup>
			</IDEHeader>
		</div>
	);
}
