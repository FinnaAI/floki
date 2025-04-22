"use client";

import path from "path";
import FileViewer from "@/components/FileViewer";
import { Terminal } from "@/components/terminal/Terminal";
import { VsTerminal } from "@/components/terminal/VsTerminal";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
	CheckCircle,
	ChevronLeft,
	ChevronRight,
	Eye,
	EyeOff,
	FileBadge,
	FileCode,
	FileImage,
	FileJson,
	FileText,
	FileType,
	Folder,
	FolderClosed,
	GitCompare,
	Home,
	RefreshCcw,
	Search,
	Terminal as TerminalIcon,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import React from "react";

interface FileInfo {
	name: string;
	path: string;
	isDirectory: boolean;
	size: number;
	lastModified: Date;
}

interface GitStatus {
	modified: string[];
	added: string[];
	untracked: string[];
	deleted: string[];
	ignored: string[];
	error?: string;
}

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

// Get file icon based on extension
const getFileIcon = (fileName: string) => {
	const ext = fileName.split(".").pop()?.toLowerCase();

	switch (ext) {
		case "js":
		case "jsx":
		case "ts":
		case "tsx":
			return <FileCode size={18} />;
		case "json":
			return <FileJson size={18} />;
		case "md":
		case "txt":
			return <FileText size={18} />;
		case "html":
		case "css":
		case "scss":
		case "sass":
			return <FileType size={18} />;
		case "png":
		case "jpg":
		case "jpeg":
		case "gif":
		case "svg":
			return <FileImage size={18} />;
		default:
			return <FileBadge size={18} />;
	}
};

export default function BrowserPage() {
	const [currentPath, setCurrentPath] = useState("");
	const [files, setFiles] = useState<FileInfo[]>([]);
	const [pathHistory, setPathHistory] = useState<string[]>([]);
	const [pathForward, setPathForward] = useState<string[]>([]);
	const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
	const [fileContent, setFileContent] = useState<string | null>(null);
	const [fileDiff, setFileDiff] = useState<FileDiff | null>(null);
	const [loading, setLoading] = useState(true);
	const [showGitStatus, setShowGitStatus] = useState(true);
	const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [filteredFiles, setFilteredFiles] = useState<FileInfo[]>([]);
	const [showTerminal, setShowTerminal] = useState(true);
	const [showIgnoredFiles, setShowIgnoredFiles] = useState(false);

	// Reference to track initialization
	const hasInitialized = useRef(false);

	// This ref will track the previous path for animation purposes
	const prevPathRef = useRef(currentPath);

	// Format file size for display
	const formatFileSize = (bytes: number): string => {
		if (bytes < 1024) return bytes + " B";
		else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
		else if (bytes < 1024 * 1024 * 1024)
			return (bytes / (1024 * 1024)).toFixed(1) + " MB";
		else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
	};

	// Format date for display
	const formatDate = (date: Date): string => {
		const now = new Date();
		const dateObj = new Date(date);

		// If it's today, show time only
		if (dateObj.toDateString() === now.toDateString()) {
			return dateObj.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			});
		}

		// If it's this year, show month and day
		if (dateObj.getFullYear() === now.getFullYear()) {
			return dateObj.toLocaleDateString([], { month: "short", day: "numeric" });
		}

		// Otherwise show date with year
		return dateObj.toLocaleDateString([], {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	// Filter files based on search query
	useEffect(() => {
		if (!searchQuery) {
			setFilteredFiles(files);
			return;
		}

		const lowercaseQuery = searchQuery.toLowerCase();
		const filtered = files.filter((file) =>
			file.name.toLowerCase().includes(lowercaseQuery),
		);

		setFilteredFiles(filtered);
	}, [searchQuery, files]);

	// Loading directory with animation consideration
	const loadDirectory = useCallback(
		async (dirPath: string, addToHistory = true) => {
			// Prevent unnecessary reloads if dirPath is empty and we already have files
			if (dirPath === "" && currentPath === "" && files.length > 0) {
				return;
			}

			// Skip loading same directory twice
			if (dirPath === currentPath && !loading) {
				console.log("Skipping reload of same directory:", dirPath);
				return;
			}

			setLoading(true);
			setError(null);
			setSearchQuery("");

			console.log("Loading directory:", dirPath);

			// Store path for history before it changes
			const oldPath = currentPath;
			// Update previous path ref for animation
			prevPathRef.current = oldPath;

			try {
				// Ensure we're passing the correct path to the API
				const pathParam = encodeURIComponent(dirPath);

				const response = await fetch(
					`/api/filesystem?path=${pathParam}&git=${showGitStatus}&showIgnored=${showIgnoredFiles}`,
				);
				console.log(
					"Fetching:",
					`/api/filesystem?path=${pathParam}&git=${showGitStatus}&showIgnored=${showIgnoredFiles}`,
				);

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					console.error("API error response:", errorData);
					throw new Error(
						`HTTP error ${response.status}: ${
							errorData.error || "Unknown error"
						}`,
					);
				}

				const data = await response.json();
				console.log("API response:", data);

				// Set new directory state
				setFiles(data.files);
				setFilteredFiles(data.files);
				setCurrentPath(data.path);

				if (showGitStatus && data.git) {
					setGitStatus(data.git);
				}

				// Update navigation history - only if we're not using history navigation already
				// and if we actually changed directories
				if (addToHistory && oldPath && data.path !== oldPath) {
					console.log("Adding to history:", oldPath);
					setPathHistory((prev) => [...prev, oldPath]);
					setPathForward([]);
				}
			} catch (err) {
				console.error("Error loading directory:", err);
				setError(
					err instanceof Error ? err.message : "Failed to load directory",
				);
			} finally {
				setLoading(false);
			}
		},
		// Only include dependencies that should trigger a reload
		[currentPath, showGitStatus, showIgnoredFiles, loading],
	);

	// Load file content
	const loadFileContent = useCallback(
		async (fileInfo: FileInfo) => {
			setLoading(true);
			setError(null);
			setSelectedFile(fileInfo);
			setFileDiff(null);

			try {
				const response = await fetch("/api/filesystem", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ filePath: fileInfo.path }),
				});

				if (!response.ok) throw new Error(`HTTP error ${response.status}`);

				const data = await response.json();
				setFileContent(data.content);

				// If git status is enabled and this file is modified, load the diff
				if (showGitStatus && gitStatus) {
					const relativePath = path
						.relative(currentPath, fileInfo.path)
						.replace(/\\/g, "/");

					if (gitStatus.modified.includes(relativePath)) {
						await loadFileDiff(fileInfo.path);
					}
				}
			} catch (err) {
				console.error("Error loading file:", err);
				setError(err instanceof Error ? err.message : "Failed to load file");
				setFileContent(null);
			} finally {
				setLoading(false);
			}
		},
		[currentPath, gitStatus, showGitStatus],
	);

	// Load git diff for a file
	const loadFileDiff = async (filePath: string) => {
		try {
			const response = await fetch("/api/git/diff", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ filePath }),
			});

			if (!response.ok) throw new Error(`HTTP error ${response.status}`);

			const data = await response.json();
			setFileDiff(data);
		} catch (err) {
			console.error("Error loading diff:", err);
			// Don't set error state here, not critical
		}
	};

	// Toggle terminal visibility
	const toggleTerminal = () => {
		setShowTerminal(!showTerminal);
	};

	// Navigate to parent directory
	const navigateUp = () => {
		if (!currentPath) {
			// No current path
			return;
		}

		// Use path.dirname to get the parent directory
		const parentDir = path.dirname(currentPath);
		console.log("Navigate up from:", currentPath);
		console.log("Navigate up to:", parentDir);

		// If we're at the root, go to project root
		if (
			parentDir === currentPath ||
			parentDir === path.parse(currentPath).root
		) {
			return loadDirectory("");
		}

		// Otherwise go to parent directory
		loadDirectory(parentDir);
	};

	// Go back in history
	const goBack = () => {
		if (pathHistory.length > 0) {
			const prevPath = pathHistory[pathHistory.length - 1];
			console.log("Going back to:", prevPath);
			setPathHistory((prev) => prev.slice(0, -1));
			setPathForward((prev) => [currentPath, ...prev]);

			// Ensure we don't add this navigation to history
			loadDirectory(prevPath, false);
		}
	};

	// Go forward in history
	const goForward = () => {
		if (pathForward.length > 0) {
			const nextPath = pathForward[0];
			console.log("Going forward to:", nextPath);
			setPathForward((prev) => prev.slice(1));
			setPathHistory((prev) => [...prev, currentPath]);

			// Ensure we don't add this navigation to history
			loadDirectory(nextPath, false);
		}
	};

	// Navigate to home/project root
	const goToProjectRoot = () => {
		loadDirectory("");
	};

	// Toggle git status display
	const toggleGitStatus = () => {
		setShowGitStatus(!showGitStatus);
		loadDirectory(currentPath, false);
	};

	// Reload current directory
	const refreshDirectory = () => {
		loadDirectory(currentPath, false);
	};

	// Determine file status for styling
	const getFileStatus = (filePath: string): string => {
		if (!gitStatus) return "";

		const relativePath = path
			.relative(currentPath, filePath)
			.replace(/\\/g, "/");

		if (gitStatus.modified.includes(relativePath)) return "modified";
		if (gitStatus.added.includes(relativePath)) return "added";
		if (gitStatus.deleted.includes(relativePath)) return "deleted";
		if (gitStatus.untracked.includes(relativePath)) return "untracked";

		return "";
	};

	// Is this a text file that can be displayed?
	const isTextFile = (fileName: string) => {
		const textExtensions = [
			"txt",
			"md",
			"js",
			"jsx",
			"ts",
			"tsx",
			"css",
			"scss",
			"html",
			"json",
			"yml",
			"yaml",
			"xml",
			"svg",
			"py",
			"rb",
			"sh",
			"bash",
			"c",
			"cpp",
			"h",
			"java",
			"php",
			"go",
			"rust",
			"fs",
		];
		const ext = fileName.split(".").pop()?.toLowerCase();
		return textExtensions.includes(ext || "");
	};

	// Get breadcrumbs for navigation
	const getBreadcrumbs = () => {
		if (!currentPath) return [{ name: "project root", path: "" }];

		// We'll use the actual paths returned by the API, which are absolute
		// But we'll display user-friendly names

		// Start with project root
		const crumbs = [{ name: "project root", path: "" }];

		// Split the current path
		const parts = currentPath.split(path.sep).filter(Boolean);

		// Build up the paths progressively
		for (let i = 0; i < parts.length; i++) {
			// Get all parts up to this index
			const pathParts = parts.slice(0, i + 1);
			// Join with path separator
			const fullPath = path.sep + pathParts.join(path.sep);

			crumbs.push({
				name: parts[i],
				path: fullPath,
			});
		}

		return crumbs;
	};

	// Handle directory navigation for files
	const handleFileClick = useCallback(
		(file: FileInfo) => {
			if (file.isDirectory) {
				console.log("Navigating to directory:", file.path);
				loadDirectory(file.path);
			} else {
				loadFileContent(file);
			}
		},
		[loadDirectory, loadFileContent],
	);

	// Toggle showing ignored files
	const toggleIgnoredFiles = () => {
		setShowIgnoredFiles(!showIgnoredFiles);
		loadDirectory(currentPath, false);
	};

	// Determine if file is ignored by git
	const isIgnored = (filePath: string): boolean => {
		if (!gitStatus || !gitStatus.ignored || gitStatus.ignored.length === 0)
			return false;

		// Get the relative path for matching
		const relativePath = path
			.relative(currentPath, filePath)
			.replace(/\\/g, "/");

		// File is explicitly in the ignored list
		if (gitStatus.ignored.includes(relativePath)) {
			return true;
		}

		// Check if file is in an ignored directory
		for (const pattern of gitStatus.ignored) {
			// Direct match
			if (relativePath === pattern) {
				return true;
			}

			// Directory match (if pattern ends with /)
			if (pattern.endsWith("/") && relativePath.startsWith(pattern)) {
				return true;
			}

			// Handle wildcards for specific file extensions
			if (
				pattern.startsWith("*.") &&
				relativePath.endsWith(pattern.substring(1))
			) {
				return true;
			}

			// Pattern with wildcards - convert to regex
			if (pattern.includes("*")) {
				const regexPattern = new RegExp(
					`^${pattern.replace(/\*/g, ".*").replace(/\?/g, ".")}$`,
				);
				if (regexPattern.test(relativePath)) {
					return true;
				}
			}
		}

		return false;
	};

	// Load initial directory on mount
	useEffect(() => {
		if (!hasInitialized.current) {
			hasInitialized.current = true;
			loadDirectory("");
		}
	}, [loadDirectory]);

	return (
		<div className="h-screen w-full overflow-hidden">
			{/* Main container with overflow hidden to prevent whole page scrolling */}
			<div className="flex h-full flex-col overflow-hidden dark:bg-slate-900">
				{/* Navigation Bar with controls and search */}
				<div className="flex flex-row justify-between border-slate-200 border-b px-4 py-3 dark:border-slate-800">
					<div className="flex w-full flex-row justify-between gap-2 p-2">
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="icon"
								onClick={goBack}
								disabled={pathHistory.length === 0}
								className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
								title="Back"
							>
								<ChevronLeft size={18} />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={goForward}
								disabled={pathForward.length === 0}
								className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
								title="Forward"
							>
								<ChevronRight size={18} />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={navigateUp}
								className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
								title="Up one level"
							>
								<ChevronLeft size={18} />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={goToProjectRoot}
								className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
								title="Project root"
							>
								<Home size={18} />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={refreshDirectory}
								className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
								title="Refresh"
							>
								<RefreshCcw size={18} />
							</Button>
							<Button
								variant={showGitStatus ? "default" : "outline"}
								size="sm"
								onClick={toggleGitStatus}
								className="h-8 rounded-full px-3"
								title="Toggle Git status"
							>
								<GitCompare size={16} className="mr-1" />
								<span>Git</span>
							</Button>
							<div className="relative ml-2 flex-1">
								<Input
									type="text"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search files..."
									className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pr-4 pl-8 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:focus:ring-blue-600"
								/>
							</div>
						</div>

						<div className="flex space-x-3">
							<Button
								variant="outline"
								size="sm"
								onClick={toggleTerminal}
								className={cn(
									"rounded-lg shadow-sm",
									showTerminal
										? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-400"
										: "border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800",
								)}
							>
								<TerminalIcon
									size={16}
									className={cn(
										"mr-1.5",
										showTerminal
											? "text-emerald-500"
											: "text-slate-600 dark:text-slate-400",
									)}
								/>
								Terminal
							</Button>
							<Button
								variant={showIgnoredFiles ? "default" : "outline"}
								size="sm"
								onClick={toggleIgnoredFiles}
								className="rounded-lg shadow-sm"
								title={
									showIgnoredFiles ? "Hide ignored files" : "Show ignored files"
								}
							>
								{showIgnoredFiles ? (
									<EyeOff size={16} className="mr-1.5" />
								) : (
									<Eye size={16} className="mr-1.5" />
								)}
								{showIgnoredFiles ? "Hide Ignored" : "Show Ignored"}
							</Button>
							<Button
								variant="outline"
								size="sm"
								asChild
								className="rounded-lg border-slate-200 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
							>
								<Link href="/">
									<Home
										size={16}
										className="mr-1.5 text-slate-600 dark:text-slate-400"
									/>
									Home
								</Link>
							</Button>
						</div>
					</div>
				</div>

				<div className="flex flex-row justify-between border-slate-200 border-b px-4 py-3 dark:border-slate-800">
					{/* Breadcrumbs */}
					<Breadcrumb className="flex max-w-full items-center overflow-x-auto py-1 text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
						<BreadcrumbList className="whitespace-nowrap">
							{getBreadcrumbs().map((crumb, index, array) => (
								<React.Fragment key={crumb.path}>
									<BreadcrumbItem>
										<BreadcrumbLink
											asChild
											className={
												index === array.length - 1
													? "font-medium text-blue-600 dark:text-blue-400"
													: ""
											}
											aria-current={
												index === array.length - 1 ? "page" : undefined
											}
										>
											<button onClick={() => loadDirectory(crumb.path)}>
												{crumb.name}
											</button>
										</BreadcrumbLink>
									</BreadcrumbItem>
									{index < array.length - 1 && <BreadcrumbSeparator />}
								</React.Fragment>
							))}
						</BreadcrumbList>
					</Breadcrumb>
				</div>

				{/* Main Content - ResizablePanelGroup */}
				<ResizablePanelGroup direction="horizontal" className="">
					{/* File Browser Panel */}
					<ResizablePanel defaultSize={20} minSize={15} maxSize={50}>
						<ScrollArea className="h-full">
							<div className="p-2">
								{loading && !filteredFiles.length ? (
									<div className="flex h-24 items-center justify-center text-slate-500">
										<div className="mr-2 h-6 w-6 animate-spin rounded-full border-blue-500 border-b-2"></div>
										Loading...
									</div>
								) : error ? (
									<div className="flex h-24 items-center justify-center text-red-500">
										<div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
											Error: {error}
										</div>
									</div>
								) : filteredFiles.length === 0 ? (
									<div className="flex h-24 flex-col items-center justify-center text-slate-500">
										{searchQuery ? (
											<>
												<p>No files match your search</p>
												<button
													onClick={() => setSearchQuery("")}
													className="mt-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
												>
													Clear search
												</button>
											</>
										) : (
											<p>This directory is empty</p>
										)}
									</div>
								) : (
									<div
										key={currentPath}
										className="animate-[fadeIn_2s_ease-out] space-y-0.5"
									>
										{filteredFiles.map((file, index) => {
											const fileStatus = getFileStatus(file.path);
											const isIgnoredFile = isIgnored(file.path);

											const statusColorClass =
												fileStatus === "modified"
													? "text-amber-500 dark:text-amber-400"
													: fileStatus === "added"
														? "text-green-500 dark:text-green-400"
														: fileStatus === "deleted"
															? "text-red-500 dark:text-red-400"
															: fileStatus === "untracked"
																? "text-blue-500 dark:text-blue-400"
																: "";

											// Don't show ignored files unless showIgnoredFiles is true
											if (isIgnoredFile && !showIgnoredFiles) {
												return null;
											}

											// Visual indicator for Git status
											const gitStatusIndicator = fileStatus ? (
												<div
													className={cn(
														"absolute top-0 bottom-0 left-0 w-1 rounded-l-md",
														fileStatus === "modified"
															? "bg-amber-500"
															: fileStatus === "added"
																? "bg-green-500"
																: fileStatus === "deleted"
																	? "bg-red-500"
																	: fileStatus === "untracked"
																		? "bg-blue-500"
																		: "",
													)}
												/>
											) : null;

											// Calculate animation delay class based on index
											const animationDelayClass =
												index < 10
													? `animate-[staggeredFadeIn_0.15s_ease-out_forwards] opacity-0 [animation-delay:${
															(index + 1) * 0.01
														}s]`
													: `animate-[staggeredFadeIn_0.15s_ease-out_forwards] opacity-0 [animation-delay:0.1s]`;

											return (
												<div
													key={file.path}
													className={cn(
														"relative flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 transition-all",
														selectedFile?.path === file.path
															? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
															: "hover:bg-slate-100 dark:hover:bg-slate-800/50",
														isIgnoredFile
															? "text-slate-400 dark:text-slate-600"
															: "",
													)}
													onClick={() => handleFileClick(file)}
												>
													{gitStatusIndicator}
													<div
														className={cn(
															"mr-2 shrink-0",
															isIgnoredFile
																? "text-slate-400 dark:text-slate-600"
																: statusColorClass ||
																		(file.isDirectory
																			? "text-amber-500 dark:text-amber-400"
																			: "text-blue-500 dark:text-blue-400"),
														)}
													>
														{file.isDirectory ? (
															file.name === ".git" || isIgnoredFile ? (
																<FolderClosed size={18} />
															) : (
																<Folder size={18} />
															)
														) : (
															getFileIcon(file.name)
														)}
													</div>
													<div className="min-w-0 flex-1">
														<div className="flex items-center truncate">
															<span
																className={cn(
																	"truncate font-medium",
																	isIgnoredFile
																		? "text-slate-400 dark:text-slate-600"
																		: statusColorClass,
																)}
															>
																{file.name}
															</span>
														</div>
														<div className="flex items-center text-slate-500 text-xs dark:text-slate-400">
															<span className="truncate">
																{formatDate(new Date(file.lastModified))}
																{!file.isDirectory &&
																	` • ${formatFileSize(file.size)}`}
															</span>
														</div>
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
						</ScrollArea>
					</ResizablePanel>

					<ResizableHandle withHandle />

					{/* File Content Panel */}
					<ResizablePanel defaultSize={40} minSize={20}>
						<FileViewer
							selectedFile={selectedFile}
							fileContent={fileContent}
							fileDiff={fileDiff}
							loading={loading}
							error={error}
						/>
					</ResizablePanel>

					{showTerminal && (
						<>
							<ResizableHandle withHandle />

							{/* Terminal Panel */}
							<ResizablePanel defaultSize={30} minSize={20}>
								<div className="flex h-full flex-col overflow-hidden">
									<VsTerminal />
								</div>
							</ResizablePanel>
						</>
					)}
				</ResizablePanelGroup>

				{/* Footer/status bar */}
				<div className="flex h-8 items-center justify-between border-slate-200 border-t bg-slate-100 px-4 text-slate-500 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
					<div>
						{filteredFiles.length} items
						{searchQuery && ` (filtered)`}
					</div>
					<div className="flex space-x-4">
						{showGitStatus && gitStatus && (
							<div className="flex space-x-3">
								{gitStatus.modified.length > 0 && (
									<span className="text-amber-500 dark:text-amber-400">
										{gitStatus.modified.length} modified
									</span>
								)}
								{gitStatus.added.length > 0 && (
									<span className="text-green-500 dark:text-green-400">
										{gitStatus.added.length} added
									</span>
								)}
								{gitStatus.deleted.length > 0 && (
									<span className="text-red-500 dark:text-red-400">
										{gitStatus.deleted.length} deleted
									</span>
								)}
								{gitStatus.untracked.length > 0 && (
									<span className="text-blue-500 dark:text-blue-400">
										{gitStatus.untracked.length} untracked
									</span>
								)}
								{gitStatus.ignored && gitStatus.ignored.length > 0 && (
									<span className="text-slate-500 dark:text-slate-400">
										{showIgnoredFiles ? gitStatus.ignored.length : "?"} ignored
									</span>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
