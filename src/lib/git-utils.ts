import { promises as fs } from "fs";
import path from "path";

export async function findGitRoot(startPath: string): Promise<string | null> {
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
		let currentPath = dirPath; // Start with the given directory
		while (currentPath) {
			try {
				const gitDir = path.join(currentPath, ".git");
				const stats = await fs.stat(gitDir);
				if (stats.isDirectory()) {
					// console.log(`Found git repository at: ${currentPath}`);
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

// Basic parser for git diff output to extract hunks
export function parseDiffOutput(diffOutput: string) {
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
