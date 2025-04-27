import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import { EditorToolbar } from "./components/editor-toolbar";
import { ImageViewer } from "./components/image-viewer";
import { MonacoWrapper } from "./components/monaco-wrapper";
import { useDiff } from "./hooks/use-diff";
import type { FileDiff, FileInfo } from "./types";
// Import util for language detection
import { getLanguageFromFileName } from "./utils/language-map";

interface FileMonacoEditorProps {
	selectedFile: FileInfo | null;
	fileContent: string | null;
	fileDiff: FileDiff | null;
	loading: boolean;
	error: string | null;
	gitStatus?: {
		modified: string[];
		added: string[];
		untracked: string[];
		deleted: string[];
		ignored: string[];
	} | null;
	currentPath?: string;
	onFileContentChange?: (newContent: string) => void;
}

const loadAvailableThemes = async () => {
	try {
		const response = await fetch("/api/themes");
		const data = await response.json();
		return data.themes as string[];
	} catch (error) {
		console.error("Failed to load available themes:", error);
		return ["OneDark-Pro"]; // Fallback to default theme
	}
};

// diff editor must load on client only
const DiffEditor = dynamic(
	() =>
		import("@monaco-editor/react").then((mod) => ({ default: mod.DiffEditor })),
	{ ssr: false, loading: () => null },
);

export const FileMonacoEditor = React.memo(
	({
		selectedFile,
		fileContent,
		fileDiff: initialFileDiff,
		loading,
		error,
		gitStatus,
		currentPath = "",
		onFileContentChange,
	}: FileMonacoEditorProps) => {
		const [isEditing, setIsEditing] = useState(false);
		const [availableThemes, setAvailableThemes] = useState<string[]>([]);
		const [editorTheme, setEditorTheme] = useState("OneDark-Pro");

		// Load available themes
		useEffect(() => {
			void loadAvailableThemes().then(setAvailableThemes);
		}, []);

		// Get file status from git status
		const getFileStatus = (filePath: string) => {
			if (!gitStatus || !filePath) return null;
			if (gitStatus.modified.includes(filePath)) return "modified";
			if (gitStatus.added.includes(filePath)) return "added";
			if (gitStatus.deleted.includes(filePath)) return "deleted";
			if (gitStatus.untracked.includes(filePath)) return "untracked";
			return null;
		};

		const fileStatus = selectedFile ? getFileStatus(selectedFile.path) : null;

		// Initialize diff hook
		const { showDiff, diffData, loadDiff, toggleDiff, handleDiffEditorMount } =
			useDiff({
				currentPath,
				fileStatus,
			});

		// Load diff when file changes
		useEffect(() => {
			if (selectedFile && fileContent && fileStatus === "modified") {
				void loadDiff(selectedFile.path, fileContent);
			}
		}, [selectedFile, fileContent, fileStatus, loadDiff]);

		// Determine if this is an image file
		const isImageFile = selectedFile?.name.match(
			/\.(png|jpe?g|gif|svg|ico|webp|bmp|tiff)$/i,
		);

		// Toggle editing mode
		const handleEditToggle = () => {
			if (isEditing && onFileContentChange) {
				onFileContentChange(fileContent || "");
			}
			setIsEditing(!isEditing);
		};

		// hush unused loading prop for now
		void loading;

		if (error) {
			return (
				<div className="flex h-24 items-center justify-center text-red-500">
					<div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
						Error: {error}
					</div>
				</div>
			);
		}

		if (!selectedFile) {
			return (
				<div className="flex h-64 flex-col items-center justify-center text-slate-500">
					<FileText
						size={48}
						className="mb-4 text-slate-300 dark:text-slate-700"
					/>
					<p className="font-medium text-xl">
						Select a file to view its contents
					</p>
					<p className="mt-2 text-sm">
						Choose a file from the browser on the left
					</p>
				</div>
			);
		}

		return (
			<div className="flex h-full flex-col overflow-hidden">
				<EditorToolbar
					selectedFile={selectedFile}
					currentPath={currentPath}
					isEditing={isEditing}
					onEditToggle={handleEditToggle}
					fileStatus={fileStatus}
					showDiff={showDiff}
					onDiffToggle={toggleDiff}
					currentTheme={editorTheme}
					availableThemes={availableThemes}
					onThemeChange={setEditorTheme}
				/>

				<ScrollArea className="h-full">
					<div className="w-full max-w-full">
						{/* Show Git Diff if available */}
						{showDiff &&
							fileContent &&
							fileStatus === "modified" &&
							!isImageFile && (
								<div className="mb-6 overflow-hidden">
									<div className="px-4 py-2 font-medium">
										Git Diff{" "}
										{fileStatus && (
											<span className="ml-2 text-amber-500 text-sm">
												({fileStatus})
											</span>
										)}
									</div>
									<div className="w-full overflow-hidden">
										<DiffEditor
											original={diffData?.oldContent || initialFileDiff?.oldContent || ""}
											modified={diffData?.newContent || initialFileDiff?.newContent || fileContent || ""}
											language={getLanguageFromFileName(selectedFile.name)}
											theme={editorTheme}
											beforeMount={(monaco) => {
												const themeId = editorTheme.toLowerCase().replace(/[^a-z0-9]/g, "-");
												// Define a minimal fallback theme (will overwrite if already defined, harmless)
												monaco.editor.defineTheme(themeId, {
													base: "vs-dark",
													inherit: true,
													rules: [],
													colors: {},
												});
											}}
											options={{
												readOnly: true,
												minimap: { enabled: false },
												scrollBeyondLastLine: false,
												renderSideBySide: true,
												wordWrap: "on",
												diffWordWrap: "on",
												renderWhitespace: "none",
												renderControlCharacters: false,
												renderLineHighlight: "none",
											}}
											onMount={handleDiffEditorMount}
											height="40vh"
											key={`diff-${selectedFile.path}-${showDiff}`}
										/>
									</div>
								</div>
							)}

						{/* Show File Content - Image or Text */}
						<div className="w-full overflow-hidden border border-slate-200 bg-background dark:border-slate-800 dark:bg-slate-900">
							{isImageFile ? (
								<div className="flex justify-center">
									<ImageViewer
										selectedFile={selectedFile}
										fileContent={fileContent}
									/>
								</div>
							) : (
								<MonacoWrapper
									selectedFile={selectedFile}
									fileContent={fileContent}
									isEditing={isEditing}
									theme={editorTheme}
									onContentChange={onFileContentChange}
								/>
							)}
						</div>
					</div>
				</ScrollArea>
			</div>
		);
	},
);

FileMonacoEditor.displayName = "FileMonacoEditor";
