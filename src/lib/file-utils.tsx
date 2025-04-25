import {
	FileBadge,
	FileCode,
	FileImage,
	FileJson,
	FileText,
	FileType,
} from "lucide-react";

// Get file icon based on extension
export const getFileIcon = (fileName: string) => {
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

// Format file size for display
export const formatFileSize = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024)
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

// Format date for display
export const formatDate = (date: Date): string => {
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

// Is this a text file that can be displayed?
export const isTextFile = (fileName: string) => {
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
