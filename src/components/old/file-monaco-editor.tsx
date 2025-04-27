import { Badge } from "@/components/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useGitStatusStore } from "@/store/git-status-store";
import { useIDEStore } from "@/store/ide-store";
import type { Monaco, OnMount } from "@monaco-editor/react";
import { shikiToMonaco } from "@shikijs/monaco";
import { FileText } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import React from "react";
import { createHighlighter } from "shiki";

// Add this interface to declare the global window property
declare global {
	interface Window {
		_tempFileDiff?: {
			oldContent: string;
			newContent: string;
			hunks: Array<{
				oldStart: number;
				oldLines: number;
				newStart: number;
				newLines: number;
				lines: string[];
			}>;
		};
	}
}

// Monaco must load on the client only with no loading UI
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
	ssr: false,
	loading: () => null,
});

// Also import the diff editor with no loading UI
const DiffEditor = dynamic(
	() =>
		import("@monaco-editor/react").then((mod) => ({ default: mod.DiffEditor })),
	{ ssr: false, loading: () => null },
);

// Add a more specific type for the diff editor
type DiffEditorType = {
	getOriginalEditor: () => Parameters<OnMount>[0];
	getModifiedEditor: () => Parameters<OnMount>[0];
};

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
		return ["Twilight"]; // Fallback to default theme
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

const FileMonacoEditor = ({
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
	const diffEditorRef = useRef<DiffEditorType | null>(null);
	const { getFileStatus, fetchGitStatus } = useGitStatusStore();
	const { editorTheme, setEditorTheme } = useIDEStore();
	const [showDiff, setShowDiff] = useState(false);

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

				// Ensure all token properties are properly mapped (including fontStyle and background)
				if (themeData.tokenColors) {
					for (const tokenColor of themeData.tokenColors) {
						if (tokenColor.settings && tokenColor.scope) {
							// Make sure fontStyle and background are preserved
							const settings: Record<string, string> = {
								...tokenColor.settings,
								fontStyle: tokenColor.settings.fontStyle,
								background: tokenColor.settings.background,
							};

							// Remove any undefined properties
							for (const key of Object.keys(settings)) {
								if (settings[key] === undefined) {
									delete settings[key];
								}
							}
						}
					}
				}

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

		// Set a default theme that's guaranteed to exist to avoid errors
		monaco.editor.defineTheme("default-dark", {
			base: "vs-dark",
			inherit: true,
			rules: [],
			colors: {},
		});
		monaco.editor.setTheme("default-dark");

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

		// Apply the current theme safely
		try {
			void changeTheme(editorTheme);
		} catch (e) {
			console.warn("Error applying editor theme:", e);
		}

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

			try {
				const highlighter = await createHighlighter({
					themes: ["vs-dark", "dark-plus", "github-dark", "github-light"],
					langs: ADDITIONAL_LANGUAGES,
				});

				if (monacoRef.current) {
					shikiToMonaco(highlighter, monacoRef.current);
				}
			} catch (e) {
				console.warn("Error initializing syntax highlighter:", e);
			}
		})();
	};

	// Handle diff editor mount
	const handleDiffEditorDidMount = (editor: DiffEditorType) => {
		diffEditorRef.current = editor;

		// Define default vs-dark theme if monaco is available
		if (monacoRef.current) {
			monacoRef.current.editor.defineTheme("vs-dark", {
				base: "vs-dark",
				inherit: true,
				rules: [],
				colors: {},
			});
			monacoRef.current.editor.setTheme("vs-dark");
		}
	};

	// Generate/fetch diff for the current file
	const loadDiff = async () => {
		if (!selectedFile) return;

		try {
			// For modified files, request git diff
			if (fileStatus === "modified") {
				try {
					// Reset diff state before loading
					window._tempFileDiff = undefined;

					// Get the full path of the file
					const filePath = selectedFile.path;
					console.log(`Fetching git diff for: ${filePath}`);

					// Include the project root in the request to help server find the git repo
					const projectRoot = currentPath || "";
					const encodedPath = encodeURIComponent(filePath);
					const encodedRoot = encodeURIComponent(projectRoot);

					// We already have the current content in fileContent, so include it in the request
					// to avoid trying to read the file again on the server
					const encodedContent = fileContent
						? encodeURIComponent(fileContent)
						: "";

					const response = await fetch(
						`/api/git/diff?path=${encodedPath}&rootPath=${encodedRoot}&currentContent=${encodedContent}`,
					);

					if (response.ok) {
						const diffData = await response.json();
						console.log("Diff data received:", diffData);

						// Store the diff data for use in rendering
						if (diffData && !diffData.error) {
							// Update the fileDiff state directly
							// Convert to string explicitly to avoid undefined issues
							const oldContent = String(diffData.oldContent || "");
							const newContent = String(
								diffData.newContent || fileContent || "",
							);

							// Store our diff data to be accessible later
							window._tempFileDiff = {
								oldContent,
								newContent,
								hunks: diffData.hunks || [],
							};

							// Force a re-render by toggling showDiff off and on
							setShowDiff(false);
							setTimeout(() => setShowDiff(true), 50);
							return;
						}

						console.error("Error in diff data:", diffData.error);

						// Create a simple diff with no hunks if there was an error
						window._tempFileDiff = {
							oldContent: "",
							newContent: fileContent || "",
							hunks: [],
						};
						setShowDiff(true);
					} else {
						console.error(
							"Error fetching diff, response not OK:",
							response.status,
						);
						// Create a simple diff with no hunks if there was an error
						window._tempFileDiff = {
							oldContent: "",
							newContent: fileContent || "",
							hunks: [],
						};
						setShowDiff(true);
					}
				} catch (error) {
					console.error("Error fetching diff:", error);
					// Create a simple diff with no hunks if there was an error
					window._tempFileDiff = {
						oldContent: "",
						newContent: fileContent || "",
						hunks: [],
					};
					setShowDiff(true);
				}
			} else {
				// For non-modified files, create a simple diff with no hunks
				window._tempFileDiff = {
					oldContent: "",
					newContent: fileContent || "",
					hunks: [],
				};
				setShowDiff(true);
			}
		} catch (error) {
			console.error("Error in loadDiff:", error);
			setShowDiff(false);
		}
	};

	// Toggle diff view
	const toggleDiffView = () => {
		if (showDiff) {
			setShowDiff(false);
		} else {
			void loadDiff();
		}
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

	// Get file status from the store
	const fileStatus = useMemo(() => {
		if (!selectedFile) return null;
		return getFileStatus(selectedFile.path);
	}, [selectedFile, getFileStatus]);

	// Whether to show the diff editor
	const shouldShowDiff = useMemo(() => {
		return (
			showDiff &&
			fileStatus === "modified" &&
			!isImageFile &&
			selectedFile != null
		);
	}, [showDiff, fileStatus, isImageFile, selectedFile]);

	// Parse file path for breadcrumb
	const getPathParts = useMemo(() => {
		if (!selectedFile?.path) return [];

		// Remove currentPath prefix if present
		let displayPath = selectedFile.path;
		if (currentPath && displayPath.startsWith(currentPath)) {
			displayPath = displayPath.slice(currentPath.length);
			// Remove leading slash if present
			if (displayPath.startsWith("/")) {
				displayPath = displayPath.slice(1);
			}
		}

		return displayPath.split("/").filter(Boolean);
	}, [selectedFile?.path, currentPath]);

	return (
		<div className="flex h-full flex-col overflow-hidden">
			<div className="flex h-9 items-center justify-between border-b px-1">
				<div className="flex items-center px-4 text-sm">
					{selectedFile ? (
						<>
							{/* Edit toggle button */}
							{selectedFile && !isImageFile && !shouldShowDiff && (
								<button
									type="button"
									onClick={toggleEditMode}
									className="mr-2 rounded-md px-2 py-1 text-muted-foreground text-xs"
								>
									{isEditing ? "Save" : "Edit"}
								</button>
							)}

							{/* File path breadcrumb */}
							<Breadcrumb className="flex-1 overflow-hidden">
								<BreadcrumbList className="flex-wrap">
									{getPathParts.map((part, index) => {
										const isLast = index === getPathParts.length - 1;
										// Create a compound key using the part and its path up to this point
										const keyPath = getPathParts.slice(0, index + 1).join("/");
										return (
											<React.Fragment key={keyPath}>
												{index > 0 && <BreadcrumbSeparator />}
												<BreadcrumbItem>
													{isLast ? (
														<BreadcrumbPage className="truncate font-medium">
															{part}
														</BreadcrumbPage>
													) : (
														<BreadcrumbLink className="truncate">
															{part}
														</BreadcrumbLink>
													)}
												</BreadcrumbItem>
											</React.Fragment>
										);
									})}
								</BreadcrumbList>
							</Breadcrumb>

							{/* Diff view toggle button */}
							{fileStatus === "modified" && !isImageFile && (
								<button
									type="button"
									onClick={toggleDiffView}
									className="ml-2 rounded-md px-2 py-1 text-blue-500 text-xs"
								>
									{shouldShowDiff ? "Hide Diff" : "Show Diff"}
								</button>
							)}
						</>
					) : (
						<span className="">No file selected</span>
					)}
				</div>

				<div className="flex items-center gap-2">
					{/* Theme selector */}
					<Select
						value={editorTheme}
						onValueChange={(value) => void changeTheme(value)}
					>
						<SelectTrigger className="h-7 text-xs">
							<SelectValue placeholder="Select theme" />
						</SelectTrigger>
						<SelectContent>
							{availableThemes.map((theme) => (
								<SelectItem key={theme} value={theme}>
									{theme}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

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
							{shouldShowDiff && fileContent && (
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
											original={
												window._tempFileDiff?.oldContent ||
												fileDiff?.oldContent ||
												""
											}
											modified={
												window._tempFileDiff?.newContent ||
												fileDiff?.newContent ||
												fileContent ||
												""
											}
											language={getLanguage}
											theme="github-dark"
											beforeMount={(monaco) => {
												monaco.editor.defineTheme("github-dark", {
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
											onMount={handleDiffEditorDidMount}
											height="40vh"
											key={`diff-${selectedFile?.path}-${showDiff}`}
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

export { FileMonacoEditor as FileViewer };
