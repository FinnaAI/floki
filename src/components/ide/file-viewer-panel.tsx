"use client";

import { FileMonacoEditor as FileViewer } from "@/components/editor/file-monaco-editor";
import { FileTabs } from "@/components/ide/file-tabs";
import { TiptapViewer } from "@/components/tiptap-editor";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/use-debounce";
import { createFileSystem } from "@/lib/file-system";
import { useFileStore } from "@/store/file-store";
import { useGitStatusStore } from "@/store/git-status-store";
import { useIDEStore } from "@/store/ide-store";
import type { FileDiff, FileInfo } from "@/types/files";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "sonner";

// Create file system instance
const fileSystem = createFileSystem();

// View types that will be supported
export type ViewType = "code" | "graph" | "components" | "preview";

interface ViewComponentProps {
	selectedFile: FileInfo | null;
	fileContent: string | null;
	fileDiff: FileDiff | null;
	loading: boolean;
	error: string | null;
	onFileContentChange?: (newContent: string) => void;
	gitStatus?: {
		modified: string[];
		added: string[];
		untracked: string[];
		deleted: string[];
		ignored: string[];
	} | null;
}

// Standard code view component
const CodeView = React.memo<ViewComponentProps>(
	({
		selectedFile,
		fileContent,
		fileDiff,
		loading,
		error,
		onFileContentChange,
		gitStatus,
	}) => {
		return (
			<FileViewer
				selectedFile={selectedFile}
				fileContent={fileContent}
				fileDiff={fileDiff}
				loading={loading}
				error={error}
				onFileContentChange={onFileContentChange}
				gitStatus={gitStatus}
			/>
		);
	},
);

CodeView.displayName = "CodeView";

// Placeholder for graph view
const GraphView = React.memo<ViewComponentProps>(
	({ selectedFile, fileContent, loading, error }) => {
		if (loading) return <div className="p-4">Loading graph...</div>;
		if (error) return <div className="p-4 text-red-500">{error}</div>;
		if (!selectedFile || !fileContent)
			return <div className="p-4">No file selected</div>;

		return (
			<div className="p-4">
				<h2 className="mb-2 font-semibold text-lg">Graph View</h2>
				<p>
					Graph visualization for {selectedFile.name} will be displayed here
				</p>
				{/* Future implementation of graph visualization */}
			</div>
		);
	},
);

GraphView.displayName = "GraphView";

// Placeholder for component structure view
const ComponentsView = React.memo<ViewComponentProps>(
	({ selectedFile, fileContent, loading, error }) => {
		if (loading) return <div className="p-4">Loading components...</div>;
		if (error) return <div className="p-4 text-red-500">{error}</div>;
		if (!selectedFile || !fileContent)
			return <div className="p-4">No file selected</div>;

		// This could analyze React components in the future
		return (
			<div className="p-4">
				<h2 className="mb-2 font-semibold text-lg">Component Structure</h2>
				<p>
					Component hierarchy for {selectedFile.name} will be displayed here
				</p>
				{/* Future implementation of component structure analysis */}
			</div>
		);
	},
);

ComponentsView.displayName = "ComponentsView";

// Placeholder for preview (for HTML, Markdown, etc.)
const PreviewView = React.memo<ViewComponentProps>(
	({ selectedFile, fileContent, loading, error }) => {
		if (loading) return <div className="p-4">Loading preview...</div>;
		if (error) return <div className="p-4 text-red-500">{error}</div>;
		if (!selectedFile || !fileContent)
			return <div className="p-4">No file selected</div>;

		const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "";

		return (
			<div className="h-full p-4">
				<div className="h-[calc(100%-40px)] overflow-auto rounded-md border p-4">
					{ext === "md" || ext === "markdown" ? (
						<TiptapViewer content={fileContent} className="max-w-none" />
					) : ext === "html" ? (
						<iframe
							srcDoc={fileContent}
							title={selectedFile.name}
							className="h-full w-full border-none"
							sandbox="allow-scripts"
						/>
					) : (
						<p>Preview not available for {selectedFile.name}</p>
					)}
				</div>
			</div>
		);
	},
);

PreviewView.displayName = "PreviewView";

// Map of view types to their components
const viewComponents: Record<ViewType, React.FC<ViewComponentProps>> = {
	code: CodeView,
	graph: GraphView,
	components: ComponentsView,
	preview: PreviewView,
};

interface FileViewerContentProps extends ViewComponentProps {
	activeView: ViewType;
	onViewChange: (view: ViewType) => void;
}

// Create a stable component to prevent rerendering when navigating folders
const FileViewerContent = React.memo<FileViewerContentProps>(
	({
		selectedFile,
		fileContent,
		fileDiff,
		loading,
		error,
		activeView,
		onViewChange,
		onFileContentChange,
		gitStatus,
	}) => {
		// Determine which view types are available for the current file
		const getAvailableViews = useCallback((): ViewType[] => {
			if (!selectedFile) return ["code"];

			const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "";
			const availableViews: ViewType[] = ["code"];

			// Add graph view for JavaScript/TypeScript files
			if (["js", "jsx", "ts", "tsx"].includes(ext)) {
				availableViews.push("graph");
				availableViews.push("components");
			}

			// Add preview for HTML and Markdown
			if (["html", "md", "markdown"].includes(ext)) {
				availableViews.push("preview");
			}

			return availableViews;
		}, [selectedFile]);

		const availableViews = useMemo(
			() => getAvailableViews(),
			[getAvailableViews],
		);

		// If the current active view is not available, default to code
		useEffect(() => {
			if (selectedFile && !availableViews.includes(activeView)) {
				onViewChange("code");
			}
		}, [selectedFile, availableViews, activeView, onViewChange]);

		// Get the appropriate view component
		const ViewComponent = viewComponents[activeView];

		// Memoize the view component props to prevent unnecessary rerenders
		const viewProps = useMemo(
			() => ({
				selectedFile,
				fileContent,
				fileDiff,
				loading,
				error,
				onFileContentChange,
				gitStatus,
			}),
			[
				selectedFile,
				fileContent,
				fileDiff,
				loading,
				error,
				onFileContentChange,
				gitStatus,
			],
		);

		return (
			<div className="flex h-full flex-col overflow-hidden">
				{/* File tabs bar */}
				<div className="pt-1">
					<FileTabs />
				</div>
				
				{selectedFile && (
					<div>
						<Tabs
							value={activeView}
							onValueChange={(value) => onViewChange(value as ViewType)}
							className="w-full"
						>
							<TabsList
								className="m-2 grid"
								style={{
									gridTemplateColumns: `repeat(${availableViews.length}, 1fr)`,
								}}
							>
								{availableViews.includes("code") && (
									<TabsTrigger value="code">Code</TabsTrigger>
								)}
								{availableViews.includes("graph") && (
									<TabsTrigger value="graph">Dependency Graph</TabsTrigger>
								)}
								{availableViews.includes("components") && (
									<TabsTrigger value="components">Components</TabsTrigger>
								)}
								{availableViews.includes("preview") && (
									<TabsTrigger value="preview">Preview</TabsTrigger>
								)}
							</TabsList>
						</Tabs>
					</div>
				)}

				<div className="w-full flex-1 overflow-hidden">
					<ViewComponent {...viewProps} />
				</div>
			</div>
		);
	},
);

FileViewerContent.displayName = "FileViewerContent";

// Main extensible file viewer panel
export const FileViewerPanel: React.FC = () => {
	const { selectedFile, fileContent, fileDiff, fileLoading, error } =
		useFileStore();
	const { gitStatus } = useGitStatusStore();
	const [activeView, setActiveView] = useState<ViewType>("code");
	const addFileTab = useIDEStore((state) => state.addFileTab);

	// Memoize the onViewChange callback
	const handleViewChange = useCallback((view: ViewType) => {
		setActiveView(view);
	}, []);

	// Create the file content change handler
	const handleContentChange = useCallback(
		async (newContent: string) => {
			if (!selectedFile) return;

			try {
				// Show loading toast
				toast.loading(`Saving ${selectedFile.name}...`);

				// Save the file using the file system
				await fileSystem.writeFile(selectedFile.path, newContent);

				// Update the local content
				useFileStore.setState({ fileContent: newContent });

				toast.success(`File ${selectedFile.name} saved successfully`);
			} catch (error) {
				console.error("Error saving file:", error);
				toast.error(
					`Failed to save ${selectedFile.name}: ${
						error instanceof Error ? error.message : String(error)
					}`,
				);
			}
		},
		[selectedFile],
	);

	// Create debounced version of the handler
	const { debouncedCallback: handleFileContentChange } = useDebounce(
		handleContentChange,
		500,
	);

	// Add file to tabs when selected
	useEffect(() => {
		if (selectedFile && !selectedFile.isDirectory) {
			addFileTab({
				path: selectedFile.path,
				name: selectedFile.name
			});
		}
	}, [selectedFile, addFileTab]);

	// Memoize the current file state to prevent changes when switching folders
	const fileState = useMemo(
		() => ({
			selectedFile,
			fileContent,
			fileDiff,
			loading: fileLoading,
			error,
			gitStatus,
		}),
		[selectedFile, fileContent, fileDiff, fileLoading, error, gitStatus],
	);

	// No file selected - doesn't depend on loading state
	if (!selectedFile) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400">
				<div className="text-center">
					<p>Select a file to view its contents</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full w-full overflow-hidden">
			<FileViewerContent
				{...fileState}
				activeView={activeView}
				onViewChange={handleViewChange}
				onFileContentChange={handleFileContentChange}
			/>
		</div>
	);
};
