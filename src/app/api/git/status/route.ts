import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { type NextRequest, NextResponse } from "next/server";

interface GitStatus {
	modified: string[];
	added: string[];
	untracked: string[];
	deleted: string[];
	ignored: string[];
	error?: string;
}

function getGitStatus(dirPath: string, includeIgnored = false): GitStatus {
	try {
		// Check if directory is part of a git repository
		let isGitRepo = false;

		// First check if there's a .git directory
		if (fs.existsSync(path.join(dirPath, ".git"))) {
			isGitRepo = true;
		} else {
			// Try to run git command, but catch errors if git is not installed
			try {
				const result = execSync("git rev-parse --is-inside-work-tree", {
					cwd: dirPath,
					stdio: ["ignore", "pipe", "ignore"],
				});
				isGitRepo = result.toString().trim() === "true";
			} catch (gitError) {
				console.log("Git command failed, assuming not a git repository");
				isGitRepo = false;
			}
		}

		if (!isGitRepo) {
			return {
				modified: [],
				added: [],
				deleted: [],
				untracked: [],
				ignored: [],
				error: "Not a git repository",
			};
		}

		let gitStatus = "";
		try {
			gitStatus = execSync("git status --porcelain", {
				cwd: dirPath,
			}).toString();
		} catch (gitError) {
			console.error("Error running git status command:", gitError);
			return {
				modified: [],
				added: [],
				deleted: [],
				untracked: [],
				ignored: [],
				error: "Git status command failed",
			};
		}

		const files = gitStatus.split("\n").filter(Boolean);

		const statusMap = {
			modified: [] as string[],
			added: [] as string[],
			deleted: [] as string[],
			untracked: [] as string[],
			ignored: [] as string[],
		};

		for (const file of files) {
			const status = file.substring(0, 2).trim();
			const filepath = file.substring(3);

			if (status === "M" || status === "MM") {
				statusMap.modified.push(filepath);
			} else if (status === "A") {
				statusMap.added.push(filepath);
			} else if (status === "D") {
				statusMap.deleted.push(filepath);
			} else if (status === "??") {
				statusMap.untracked.push(filepath);
			}
		}

		// Get ignored files if requested
		if (includeIgnored) {
			try {
				// First, get files that are already ignored in the working directory
				const ignoredOutput = execSync(
					"git ls-files --others --ignored --exclude-standard",
					{
						cwd: dirPath,
					},
				).toString();

				statusMap.ignored = ignoredOutput.split("\n").filter(Boolean);

				// Then, add gitignore patterns for better matching
				if (fs.existsSync(path.join(dirPath, ".gitignore"))) {
					const gitignoreContent = fs.readFileSync(
						path.join(dirPath, ".gitignore"),
						"utf-8",
					);

					// Process each line in the gitignore file
					const patterns = gitignoreContent
						.split("\n")
						.map((line) => line.trim())
						.filter((line) => line && !line.startsWith("#"))
						.flatMap((pattern) => {
							// Ensure directory patterns end with slash
							if (pattern.endsWith("/")) {
								return pattern;
							}
							// If pattern doesn't have an extension and doesn't have a wildcard,
							// it might be a directory - add both versions
							if (!pattern.includes(".") && !pattern.includes("*")) {
								return [pattern, `${pattern}/`];
							}
							return pattern;
						});

					// Add these processed patterns
					statusMap.ignored.push(...patterns);
				}

				// Add some common ignored patterns that might not be in .gitignore
				const commonIgnoredPatterns = [
					"node_modules/",
					".git/",
					".DS_Store",
					"*.log",
					"dist/",
					"build/",
					".next/",
					"*.swp",
					"*.bak",
					".idea/",
					".vscode/",
				];
				statusMap.ignored.push(...commonIgnoredPatterns);

				// Remove duplicates
				statusMap.ignored = [...new Set(statusMap.ignored)];
			} catch (error) {
				console.error("Error getting git ignored files:", error);
			}
		}

		return statusMap;
	} catch (error) {
		console.error(`Error getting git status for ${dirPath}:`, error);
		return {
			modified: [],
			added: [],
			deleted: [],
			untracked: [],
			ignored: [],
			error: (error as Error).message,
		};
	}
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const dirPath = searchParams.get("path") || process.cwd();
	const showIgnored = searchParams.get("showIgnored") === "true";

	try {
		const gitStatus = getGitStatus(dirPath, showIgnored);
		return NextResponse.json(gitStatus);
	} catch (error) {
		return NextResponse.json(
			{ error: (error as Error).message },
			{ status: 500 },
		);
	}
}
