import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useGitStatusStore } from "@/store/git-status-store";
import { useIDEStore } from "@/store/ide-store";
import type { Monaco, OnMount } from "@monaco-editor/react";
import { shikiToMonaco } from "@shikijs/monaco";
import { FileText } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createHighlighter } from "shiki";

// Monaco must load on the client only with no loading UI
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
	ssr: false,
	loading: () => null,
});

// Also import the diff editor with no loading UI
const MonacoDiffEditor = dynamic(
	() => import("@monaco-editor/react").then((mod) => mod.DiffEditor),
	{ ssr: false, loading: () => null },
);

// Add theme loading functions
const loadTheme = async (themeName: string) => {
	try {
		const response = await fetch(`/themes/${themeName}.json`);
		const data = await response.json();
		return data;
	} catch (error) {
		console.error(`Failed to load theme ${themeName}:`, error);
		return null;
	}
};

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

interface FileDiff {
	oldContent: string;
	newContent: string;
	hunks: {
		oldStart: number;
		oldLines: number;
		newStart: number;
		newLines: number;
		lines: string[];
	}[];
}

interface FileInfo {
	name: string;
	path: string;
	isDirectory: boolean;
	size: number;
	lastModified: Date | string;
}

interface FileViewerProps {
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

// Format file size for display
const formatFileSize = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024)
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const FileViewer = ({
	selectedFile,
	fileContent,
	fileDiff,
	loading,
	error,
	gitStatus,
	currentPath = "",
	onFileContentChange,
}: FileViewerProps) => {
	const [isEditing, setIsEditing] = useState(false);
	const [availableThemes, setAvailableThemes] = useState<string[]>([]);
	const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
	const monacoRef = useRef<Monaco | null>(null);
	const diffEditorRef = useRef<
		Parameters<typeof MonacoDiffEditor>["onMount"][0] | null
	>(null);
	const { getFileStatus } = useGitStatusStore();
	const { editorTheme, setEditorTheme } = useIDEStore();

	// Load available themes
	useEffect(() => {
		void loadAvailableThemes().then(setAvailableThemes);
	}, []);

	// Load and set theme
	const changeTheme = useMemo(
		() => async (themeName: string) => {
			const themeData = await loadTheme(themeName);
			if (themeData && monacoRef.current) {
				const themeId = themeName.toLowerCase().replace(/[^a-z0-9]/g, "-");
				monacoRef.current.editor.defineTheme(themeId, themeData);
				monacoRef.current.editor.setTheme(themeId);
				setEditorTheme(themeName); // Update the persisted theme
			}
		},
		[setEditorTheme],
	);

	// Toggle editing mode
	const toggleEditMode = () => {
		// Save changes when exiting edit mode
		if (isEditing && editorRef.current && onFileContentChange) {
			// @ts-ignore - Monaco editor instance is properly set in handleEditorDidMount
			onFileContentChange(editorRef.current.getValue());
		}
		setIsEditing(!isEditing);
	};

	// Handle editor mount with optimized settings
	const handleEditorDidMount: OnMount = (editor, monaco) => {
		editorRef.current = editor;
		monacoRef.current = monaco;

		// Apply performance optimizations
		editor.getModel()?.setEOL(0); // Use \n for line endings
		monaco.editor.setTheme(editorTheme);

		// Optimize editor settings for performance
		editor.updateOptions({
			renderWhitespace: "none", // Disable whitespace rendering
			renderControlCharacters: false, // Disable control character rendering
			guides: { indentation: false }, // Disable indent guides (correct property)
			renderLineHighlight: "none", // Disable current line highlighting
			renderValidationDecorations: "editable", // Only show validation decorations when editing
			scrollBeyondLastLine: false,
			quickSuggestions: false, // Disable quick suggestions
			wordWrap: "on",
			minimap: {
				enabled: true,
				maxColumn: 80,
				showSlider: "mouseover",
				scale: 1.4,
			},
		});

		// Apply the current theme
		void changeTheme(editorTheme);

		void (async () => {
			const ADDITIONAL_LANGUAGES = [
				"jsx",
				"tsx",
				"vue",
				"svelte",
			] as const satisfies Parameters<typeof createHighlighter>[0]["langs"];

			for (const lang of ADDITIONAL_LANGUAGES) {
				monacoRef.current?.languages.register({ id: lang });
			}

			const highlighter = await createHighlighter({
				themes: ["dark-plus", "vs-dark"],
				langs: ADDITIONAL_LANGUAGES,
			});

			shikiToMonaco(highlighter, monacoRef.current);
		})();
	};

	// Handle diff editor mount
	const handleDiffEditorDidMount = (
		editor: Parameters<typeof MonacoDiffEditor>["onMount"][0],
	) => {
		diffEditorRef.current = editor;
		// Apply the current theme immediately after mount
		void changeTheme(editorTheme);
	};

	// Determine if this is an image file
	const isImageFile = useMemo(() => {
		if (!selectedFile?.name) return false;
		const imageExtensions = [
			"png",
			"jpg",
			"jpeg",
			"gif",
			"svg",
			"ico",
			"webp",
			"bmp",
			"tiff",
		];
		const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "";
		return imageExtensions.includes(ext);
	}, [selectedFile]);

	// Determine language for syntax highlighting
	const getLanguage = useMemo(() => {
		if (!selectedFile?.name) return "text";
		const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "";

		// Map file extensions to language identifiers
		const languageMap: Record<string, string> = {
			js: "javascript",
			jsx: "javascript",
			ts: "typescript",
			tsx: "typescript",
			html: "html",
			css: "css",
			scss: "scss",
			json: "json",
			md: "markdown",
			py: "python",
			rb: "ruby",
			java: "java",
			c: "c",
			cpp: "cpp",
			cs: "csharp",
			go: "go",
			php: "php",
			rs: "rust",
			swift: "swift",
			sh: "shell",
			yml: "yaml",
			yaml: "yaml",
			xml: "xml",
			sql: "sql",
			graphql: "graphql",
			kt: "kotlin",
			dart: "dart",
		};

		return languageMap[ext] || "text";
	}, [selectedFile]);

	// Determine file git status
	const getFileGitStatus = useMemo(() => {
		if (!selectedFile || !gitStatus || !currentPath) return null;

		// Get the relative path for matching
		const relativePath = selectedFile.path
			.replace(currentPath, "")
			.replace(/^\/+/, ""); // Remove leading slashes

		if (gitStatus.modified.includes(relativePath)) return "modified";
		if (gitStatus.added.includes(relativePath)) return "added";
		if (gitStatus.deleted.includes(relativePath)) return "deleted";
		if (gitStatus.untracked.includes(relativePath)) return "untracked";

		return null;
	}, [selectedFile, gitStatus, currentPath]);

	// Get file status from the store
	const fileStatus = useMemo(() => {
		if (!selectedFile) return null;
		return getFileStatus(selectedFile.path);
	}, [selectedFile, getFileStatus]);

	// Whether to show the diff editor
	const showDiffEditor = useMemo(() => {
		return (
			fileStatus === "modified" &&
			fileDiff &&
			fileDiff.oldContent !== null &&
			fileDiff.newContent !== null
		);
	}, [fileStatus, fileDiff]);

	return (
		<div className="flex h-full flex-col overflow-hidden">
			<div className="flex h-9 items-center justify-between border-b px-1">
				<div className="flex items-center px-4 text-sm">
					{selectedFile ? (
						<span className="truncate font-medium text-xs">
							{selectedFile.path.replace(`${currentPath}/`, "")}

							{/* Edit toggle button */}
							{selectedFile && !isImageFile && !showDiffEditor && (
								<button
									type="button"
									onClick={toggleEditMode}
									className="rounded-md px-2 py-1 text-muted-foreground text-xs"
								>
									{isEditing ? "Save" : "Edit"}
								</button>
							)}
							{/* <span className="ml-2">{formatFileSize(selectedFile.size)}</span> */}
						</span>
					) : (
						<span className="">No file selected</span>
					)}
				</div>

				<div className="flex items-center gap-2">
					{/* Theme selector */}
					<select
						value={editorTheme}
						onChange={(e) => void changeTheme(e.target.value)}
						className="rounded-md px-2 py-1 text-xs"
					>
						{availableThemes.map((theme) => (
							<option key={theme} value={theme}>
								{theme}
							</option>
						))}
					</select>

					{/* Git Status Badge */}
					{selectedFile && fileStatus && (
						<div className="flex items-center">
							{fileStatus === "modified" && (
								<Badge
									variant="outline"
									className="border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
								>
									Modified
								</Badge>
							)}
							{fileStatus === "added" && (
								<Badge
									variant="outline"
									className="border-green-200 bg-green-100 text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
								>
									Added
								</Badge>
							)}
							{fileStatus === "deleted" && (
								<Badge
									variant="outline"
									className="border-red-200 bg-red-100 text-red-800 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
								>
									Deleted
								</Badge>
							)}
							{fileStatus === "untracked" && (
								<Badge
									variant="outline"
									className="border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
								>
									Untracked
								</Badge>
							)}
						</div>
					)}
				</div>
			</div>

			{/* File content scroll area */}
			<ScrollArea className="h-full">
				<div className="w-full max-w-full">
					{error ? (
						<div className="flex h-24 items-center justify-center text-red-500">
							<div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
								Error: {error}
							</div>
						</div>
					) : !selectedFile ? (
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
					) : (
						<>
							{/* Show Git Diff if available using Monaco Diff Editor */}
							{showDiffEditor && (
								<div className="mb-6 overflow-hidden border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
									<div className="border-slate-200 border-b bg-slate-100 px-4 py-2 font-medium dark:border-slate-700 dark:bg-slate-800">
										Git Diff
									</div>
									<div className="h-[40vh]">
										<MonacoDiffEditor
											height="40vh"
											original={fileDiff?.oldContent || ""}
											modified={fileDiff?.newContent || ""}
											language={getLanguage}
											theme={editorTheme}
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
											onMount={handleDiffEditorDidMount}
										/>
									</div>
								</div>
							)}

							{/* Show File Content - Image or Text */}
							<div className="w-full overflow-hidden border border-slate-200 bg-background dark:border-slate-800 dark:bg-slate-900">
								<div
									className={cn(
										isImageFile
											? "flex justify-center"
											: "max-w-full overflow-hidden",
									)}
								>
									{isImageFile ? (
										fileContent ? (
											<div className="relative">
												{/* SVG files have raw content */}
												{selectedFile.name.toLowerCase().endsWith(".svg") ? (
													<div
														// biome-ignore lint: Using sanitized SVG content directly
														dangerouslySetInnerHTML={{ __html: fileContent }}
														className="svg-container max-h-[70vh] max-w-full"
													/>
												) : (
													/* For other image types, use data URL or Next.js Image */
													<Image
														src={`/api/file/image?path=${encodeURIComponent(
															selectedFile.path,
														)}`}
														alt={selectedFile.name}
														width={800}
														height={600}
														className="max-h-[70vh] max-w-full object-contain"
														style={{ height: "auto" }}
													/>
												)}
											</div>
										) : (
											<div className="text-slate-500">
												Image could not be loaded
											</div>
										)
									) : (
										<div className="h-[70vh] w-full overflow-hidden">
											<MonacoEditor
												height="70vh"
												language={getLanguage}
												value={fileContent || ""}
												theme={editorTheme}
												className=""
												options={{
													readOnly: !isEditing,
													minimap: {
														enabled: true,
														showSlider: "mouseover",
														scale: 1.4,
														maxColumn: 80,
													},
													scrollBeyondLastLine: false,
													fontSize: 14,
													wordWrap: "on",
													automaticLayout: true,
													renderWhitespace: "none",
													renderControlCharacters: false,
													renderLineHighlight: "none",
													quickSuggestions: false,
													folding: false,
													glyphMargin: false,
													renderValidationDecorations: "editable",
												}}
												onChange={(value) => {
													if (isEditing && onFileContentChange) {
														onFileContentChange(value || "");
													}
												}}
												onMount={handleEditorDidMount}
											/>
										</div>
									)}
								</div>
							</div>
						</>
					)}
				</div>
			</ScrollArea>
		</div>
	);
};

export { FileViewer };
