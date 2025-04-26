import { promises as fs } from "fs";
import { execSync } from "node:child_process";
import path from "path";
import { type NextRequest, NextResponse } from "next/server";

interface GitStatus {
	modified: string[];
	added: string[];
	untracked: string[];
	deleted: string[];
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
		let currentPath = dirPath;
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

async function getGitStatus(dirPath: string): Promise<GitStatus> {
	try {
		// First find the git root
		const gitRoot = await findGitRoot(dirPath);
		if (!gitRoot) {
			console.error(`No git repository found for: ${dirPath}`);
			return {
				modified: [],
				added: [],
				deleted: [],
				untracked: [],
				error: "Not a git repository",
			};
		}

		console.log(`Using git repository at: ${gitRoot}`);

		// Get status using porcelain format for stable parsing
		const output = execSync("git status --porcelain", {
			cwd: gitRoot,
			encoding: "utf-8",
		});

		const result: GitStatus = {
			modified: [],
			added: [],
			deleted: [],
			untracked: [],
		};

		const lines = output.split("\n");
		for (const line of lines) {
			if (!line) continue;

			const status = line.slice(0, 2);
			const filePath = line.slice(3);

			// Handle renamed files
			const parts = filePath.split(" -> ");
			const actualPath = parts.length > 1 && parts[1] ? parts[1] : filePath;

			if (status.includes("M") && actualPath) {
				result.modified.push(actualPath);
			} else if (status.includes("A") && actualPath) {
				result.added.push(actualPath);
			} else if (status.includes("D") && actualPath) {
				result.deleted.push(actualPath);
			} else if (status === "??" && actualPath) {
				result.untracked.push(actualPath);
			}
		}

		return result;
	} catch (error) {
		console.error("Error getting git status:", error);
		return {
			modified: [],
			added: [],
			deleted: [],
			untracked: [],
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const dirPath = searchParams.get("path");

	if (!dirPath) {
		return NextResponse.json(
			{ error: "Path parameter is required" },
			{ status: 400 },
		);
	}

	console.log(`Fetching git status for path: ${dirPath}`);

	try {
		const status = await getGitStatus(dirPath);
		// console.log("Git status result:", status);
		return NextResponse.json(status);
	} catch (error) {
		console.error("Error in git status route:", error);
		return NextResponse.json(
			{ error: "Failed to get git status" },
			{ status: 500 },
		);
	}
}
