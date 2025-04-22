import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { NextResponse } from "next/server";

interface DiffHunk {
	oldStart: number;
	oldLines: number;
	newStart: number;
	newLines: number;
	lines: string[];
}

// Parse the diff output into structured hunks
function parseDiffOutput(diffOutput: string) {
	const hunks: DiffHunk[] = [];
	let currentHunk: DiffHunk | null = null;

	// Skip the header lines (index, --- a/file, +++ b/file)
	const lines = diffOutput.split("\n");
	let startProcessing = false;

	for (const line of lines) {
		// Start processing after the +++ line
		if (line.startsWith("+++")) {
			startProcessing = true;
			continue;
		}

		if (!startProcessing) continue;

		// Hunk header: @@ -1,7 +1,8 @@ [optional section header]
		if (line.startsWith("@@")) {
			// Save previous hunk if exists
			if (currentHunk) {
				hunks.push(currentHunk);
			}

			// Parse the hunk header
			const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
			if (match) {
				currentHunk = {
					oldStart: Number.parseInt(match[1]),
					oldLines: match[2] ? Number.parseInt(match[2]) : 1,
					newStart: Number.parseInt(match[3]),
					newLines: match[4] ? Number.parseInt(match[4]) : 1,
					lines: [line],
				};
			}
		} else if (currentHunk) {
			// Add line to current hunk
			currentHunk.lines.push(line);
		}
	}

	// Don't forget to add the last hunk
	if (currentHunk) {
		hunks.push(currentHunk);
	}

	return hunks;
}

// Get repository root from any path
function getGitRepoRoot(filePath: string): string {
	try {
		return execSync("git rev-parse --show-toplevel", {
			cwd: path.dirname(filePath),
			encoding: "utf-8",
		}).trim();
	} catch (error) {
		console.error("Error finding git repository root:", error);
		return process.cwd();
	}
}

export async function POST(request: Request) {
	try {
		const { filePath } = await request.json();

		if (!filePath) {
			return NextResponse.json(
				{ error: "File path is required" },
				{ status: 400 },
			);
		}

		// Ensure file exists
		if (!fs.existsSync(filePath)) {
			return NextResponse.json({ error: "File not found" }, { status: 404 });
		}

		try {
			// Find git repository root
			const repoRoot = getGitRepoRoot(filePath);

			// Get the relative path to the file from the repo root
			const relativePath = path.relative(repoRoot, filePath);

			// Get the git diff for the file
			const diffOutput = execSync(`git diff HEAD -- "${relativePath}"`, {
				encoding: "utf-8",
				cwd: repoRoot,
			});

			// If there's no diff, try to see if it's a new file
			if (!diffOutput.trim()) {
				const isUntracked =
					execSync(
						`git ls-files --others --exclude-standard "${relativePath}"`,
						{
							encoding: "utf-8",
							cwd: repoRoot,
						},
					).trim() === relativePath;

				if (isUntracked) {
					// For new files, create a diff that shows the entire file as added
					const fileContent = fs.readFileSync(filePath, "utf-8");
					const lines = fileContent.split("\n");

					const hunk: DiffHunk = {
						oldStart: 0,
						oldLines: 0,
						newStart: 1,
						newLines: lines.length,
						lines: [
							`@@ -0,0 +1,${lines.length} @@`,
							...lines.map((line) => `+${line}`),
						],
					};

					return NextResponse.json({
						oldContent: "",
						newContent: fileContent,
						hunks: [hunk],
						isNewFile: true,
					});
				}

				return NextResponse.json({
					oldContent: "",
					newContent: "",
					hunks: [],
					noChanges: true,
				});
			}

			// Parse the diff output
			const hunks = parseDiffOutput(diffOutput);

			// Get the old content (from git)
			let oldContent = "";
			try {
				oldContent = execSync(`git show HEAD:"${relativePath}"`, {
					encoding: "utf-8",
					cwd: repoRoot,
				});
			} catch (e) {
				// File might be new and not in git yet
				console.log("Could not get previous version from git:", e);
			}

			// Get the new content (current file content)
			const newContent = fs.readFileSync(filePath, "utf-8");

			return NextResponse.json({
				oldContent,
				newContent,
				hunks,
			});
		} catch (error) {
			console.error("Error getting git diff:", error);
			return NextResponse.json(
				{ error: "Failed to get git diff", details: (error as Error).message },
				{ status: 500 },
			);
		}
	} catch (error) {
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}
}
