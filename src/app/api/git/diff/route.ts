import { promises as fs } from "fs";
import { execSync } from "node:child_process";
import path from "path";
import { type NextRequest, NextResponse } from "next/server";

interface GitDiff {
	oldContent: string;
	newContent: string;
	hunks: {
		oldStart: number;
		oldLines: number;
		newStart: number;
		newLines: number;
		lines: string[];
	}[];
	error?: string;
}

async function findGitRoot(startPath: string): Promise<string | null> {
	// Handle empty path
	if (!startPath) return null;

	// Try extracting just the real filesystem path
	let dirPath = startPath;

	// For paths from a file handle, they often have a format like "folder (path/to/folder)"
	const folderNameMatch = startPath.match(/^(.*?)\s+\((.*?)\)$/);
	if (folderNameMatch?.[2]) {
		dirPath = folderNameMatch[2]; // Use the actual path in parentheses
		console.log(`Extracted path from folder handle: ${dirPath}`);
	}

	try {
		console.log(`Checking for .git in: ${dirPath}`);
		// Try going up the directory tree to find .git
		let currentPath = path.dirname(dirPath); // Start with the directory containing the file
		while (currentPath) {
			try {
				const gitDir = path.join(currentPath, ".git");
				const stats = await fs.stat(gitDir);
				if (stats.isDirectory()) {
					console.log(`Found git repository at: ${currentPath}`);
					return currentPath;
				}
			} catch (e) {
				// .git does not exist at this level, continue up
			}

			const parentPath = path.dirname(currentPath);
			if (parentPath === currentPath) break; // We've reached the root
			currentPath = parentPath;
		}
	} catch (error) {
		console.error(`Error finding git root: ${error}`);
	}

	return null;
}

async function getGitDiff(
	filePath: string,
	startPath?: string,
	currentContent?: string,
): Promise<GitDiff> {
	try {
		// First find the git root directory
		const gitRoot = await findGitRoot(startPath || filePath);
		if (!gitRoot) {
			console.error(`No git repository found for: ${filePath}`);
			return {
				oldContent: "",
				newContent: "",
				hunks: [],
				error: "Not a git repository",
			};
		}

		console.log(`Using git repository at: ${gitRoot}`);

		// Get the filename relative to git root
		const relativeFilePath = path.relative(gitRoot, filePath);
		console.log(`File path relative to git root: ${relativeFilePath}`);

		// Get the file content from the last commit
		let oldContent = "";
		try {
			// Try with relative path first (preferred)
			oldContent = execSync(`git show HEAD:"${relativeFilePath}"`, {
				cwd: gitRoot,
				encoding: "utf-8",
			}).toString();
			console.log("Successfully got old content from git using relative path");
		} catch (error) {
			console.error("Error getting old content with relative path:", error);

			// Try with just the filename as a fallback
			try {
				const filename = path.basename(filePath);
				console.log(`Trying again with just filename: ${filename}`);
				oldContent = execSync(`git show HEAD:"${filename}"`, {
					cwd: gitRoot,
					encoding: "utf-8",
				}).toString();
				console.log("Successfully got old content using filename only");
			} catch (innerError) {
				console.error(
					"Error getting old content with filename only:",
					innerError,
				);
				// File might be newly added, so old content is empty
			}
		}

		// Get the current file content - first use provided content if available
		let newContent = "";
		if (currentContent) {
			// Use the provided content if available (from the browser)
			newContent = currentContent;
			console.log(
				`Using provided current content (${newContent.length} bytes)`,
			);
		} else {
			// Otherwise try to read from file system (only works in server context)
			try {
				newContent = await fs.readFile(filePath, "utf-8");
				console.log(
					`Got current content from file system (${newContent.length} bytes)`,
				);
			} catch (error) {
				console.error("Error reading current file content:", error);
				newContent = "";
			}
		}

		// Get the diff output
		let diffOutput = "";
		try {
			diffOutput = execSync(`git diff HEAD -- "${relativeFilePath}"`, {
				cwd: gitRoot,
				encoding: "utf-8",
			}).toString();
			console.log(
				`Got diff output using relative path (${diffOutput.length} bytes)`,
			);
		} catch (error) {
			console.error("Error getting diff with relative path:", error);

			// Try with just the filename
			try {
				const filename = path.basename(filePath);
				diffOutput = execSync(`git diff HEAD -- "${filename}"`, {
					cwd: gitRoot,
					encoding: "utf-8",
				}).toString();
				console.log(
					`Got diff output using filename only (${diffOutput.length} bytes)`,
				);
			} catch (innerError) {
				console.error("Error getting diff with filename only:", innerError);
				// Default to empty diff
				diffOutput = "";
			}
		}

		// Parse the diff output to extract hunks
		const hunks = parseDiffOutput(diffOutput);
		console.log(`Parsed ${hunks.length} hunks from diff`);

		return {
			oldContent,
			newContent,
			hunks,
		};
	} catch (error) {
		console.error("Error getting git diff:", error);
		return {
			oldContent: "",
			newContent: "",
			hunks: [],
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

// Basic parser for git diff output to extract hunks
function parseDiffOutput(diffOutput: string) {
	const hunks: {
		oldStart: number;
		oldLines: number;
		newStart: number;
		newLines: number;
		lines: string[];
	}[] = [];

	const hunkHeaders = diffOutput.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/g);
	if (!hunkHeaders) return hunks;

	for (const header of hunkHeaders) {
		const match = header.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
		if (!match || !match[1] || !match[3]) continue;

		const oldStart = Number.parseInt(match[1], 10);
		const oldLines = match[2] ? Number.parseInt(match[2], 10) : 1;
		const newStart = Number.parseInt(match[3], 10);
		const newLines = match[4] ? Number.parseInt(match[4], 10) : 1;

		// Find the content of this hunk
		const headerIndex = diffOutput.indexOf(header);
		const nextHeaderIndex = diffOutput.indexOf("@@", headerIndex + 2);
		const hunkContent =
			nextHeaderIndex > -1
				? diffOutput.substring(headerIndex + header.length, nextHeaderIndex)
				: diffOutput.substring(headerIndex + header.length);

		// Split into lines and remove the first empty line
		const lines = hunkContent.split("\n");
		if (lines[0] === "") lines.shift();
		// Remove the last empty line if present
		if (lines[lines.length - 1] === "") lines.pop();

		hunks.push({
			oldStart,
			oldLines,
			newStart,
			newLines,
			lines,
		});
	}

	return hunks;
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const filePath = searchParams.get("path");
	const rootPath = searchParams.get("rootPath");
	const currentContent = searchParams.get("currentContent");

	if (!filePath) {
		return NextResponse.json(
			{ error: "Path parameter is required" },
			{ status: 400 },
		);
	}

	console.log(`API: Getting git diff for: ${filePath}`);
	if (rootPath) {
		console.log(`API: Project root provided: ${rootPath}`);
	}
	if (currentContent) {
		console.log(
			`API: Current content provided (${currentContent.length} bytes)`,
		);
	}

	try {
		// If rootPath is provided, help the git root finder by starting there
		const startPath = rootPath || filePath;
		const diffResult = await getGitDiff(
			filePath,
			startPath,
			currentContent || undefined,
		);
		console.log(
			`API: Diff result has ${diffResult.hunks.length} hunks, old: ${diffResult.oldContent.length} bytes, new: ${diffResult.newContent.length} bytes`,
		);
		return NextResponse.json(diffResult);
	} catch (error) {
		console.error("Error in git diff route:", error);
		return NextResponse.json(
			{ error: "Failed to get git diff" },
			{ status: 500 },
		);
	}
}
