import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as util from "util";
import { NextResponse } from "next/server";

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);

// Function to expand tilde in paths
function expandTilde(filePath: string): string {
	if (filePath.startsWith("~")) {
		return path.join(os.homedir(), filePath.slice(1));
	}
	return filePath;
}

// Base path for navigation (defaults to project root but allows parent navigation within reasonable limits)
const BASE_PATH = expandTilde("~"); // Allow navigation within user's home directory

// Interface for file information
interface FileInfo {
	name: string;
	path: string;
	isDirectory: boolean;
	size: number;
	lastModified: Date;
}

// Function to get directory contents
async function getDirectoryContents(dirPath: string): Promise<FileInfo[]> {
	try {
		console.log(`Reading directory contents of: ${dirPath}`);
		const files = await readdir(dirPath);
		console.log(`Found ${files.length} items in directory`);

		const fileInfoPromises = files.map(async (file) => {
			// Use path.join for consistent path handling
			const filePath = path.join(dirPath, file);

			try {
				const stats = await stat(filePath);
				return {
					name: file,
					path: filePath, // Store the absolute path for consistency
					isDirectory: stats.isDirectory(),
					size: stats.size,
					lastModified: stats.mtime,
				};
			} catch (error) {
				console.error(`Error getting stats for ${filePath}:`, error);
				return null;
			}
		});

		const fileInfos = await Promise.all(fileInfoPromises);
		const validFiles = fileInfos.filter(
			(info): info is FileInfo => info !== null,
		);
		console.log(`Returning ${validFiles.length} valid file entries`);
		return validFiles;
	} catch (error) {
		console.error(`Error reading directory ${dirPath}:`, error);
		throw error;
	}
}

// Function to get Git status information including ignored files
function getGitStatus(dirPath: string, includeIgnored = false) {
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
				// If the command fails, we're not in a git repo or git is not installed
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

		files.forEach((file) => {
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
		});

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

// GET endpoint to list directory contents
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	let dirPath = searchParams.get("path");
	const showIgnored = searchParams.get("showIgnored") === "true";

	// Handle empty path or undefined path
	const projectRoot = process.cwd();

	// For debugging
	console.log("Received dirPath parameter:", dirPath);

	// Resolve path
	if (dirPath === null || dirPath === undefined || dirPath === "") {
		dirPath = projectRoot;
	} else {
		// Handle tilde expansion for home directory
		if (dirPath.startsWith("~")) {
			dirPath = expandTilde(dirPath);
		} else {
			// Use full path if it's an absolute path, otherwise make it relative to project root
			dirPath = path.isAbsolute(dirPath)
				? dirPath
				: path.join(projectRoot, dirPath);
		}
	}

	// Normalize the path to resolve any '..' or '.' segments
	dirPath = path.normalize(dirPath);

	// Ensure the path exists within the allowed base directory for security
	if (!dirPath.startsWith(BASE_PATH) && dirPath !== projectRoot) {
		return NextResponse.json(
			{ error: "Access denied: path outside allowed directory" },
			{ status: 403 },
		);
	}

	// Don't allow access to system directories
	const systemDirs = [
		"/bin",
		"/boot",
		"/dev",
		"/etc",
		"/lib",
		"/proc",
		"/sbin",
		"/sys",
		"/var",
		"C:\\Windows",
		"C:\\Program Files",
		"C:\\Program Files (x86)",
	];

	if (systemDirs.some((dir) => dirPath.startsWith(dir))) {
		return NextResponse.json(
			{ error: "Access denied: system directories are restricted" },
			{ status: 403 },
		);
	}

	console.log("Resolved directory path:", dirPath);

	const gitInfo = searchParams.get("git") === "true";

	try {
		// Check if the path exists and is a directory
		const pathStats = await stat(dirPath).catch((error) => {
			console.error(`Error checking path ${dirPath}:`, error);
			throw new Error(`Invalid directory path: ${dirPath}`);
		});

		if (!pathStats.isDirectory()) {
			return NextResponse.json(
				{ error: "The specified path is not a directory" },
				{ status: 400 },
			);
		}

		const files = await getDirectoryContents(dirPath);

		// Sort directories first, then files alphabetically
		files.sort((a, b) => {
			if (a.isDirectory && !b.isDirectory) return -1;
			if (!a.isDirectory && b.isDirectory) return 1;
			return a.name.localeCompare(b.name);
		});

		// Special handling for parent directory - always add it if not at BASE_PATH
		if (dirPath !== BASE_PATH && dirPath !== path.parse(dirPath).root) {
			const parentPath = path.dirname(dirPath);
			const parentStats = await stat(parentPath);

			files.unshift({
				name: "..",
				path: parentPath,
				isDirectory: true,
				size: 0,
				lastModified: parentStats.mtime,
			});
		}

		const response: any = {
			path: dirPath,
			files,
		};

		// Add git status information if requested
		if (gitInfo) {
			response.git = getGitStatus(dirPath, showIgnored);
		}

		return NextResponse.json(response);
	} catch (error) {
		console.error(`Error processing directory ${dirPath}:`, error);
		return NextResponse.json(
			{ error: "Failed to read directory", details: (error as Error).message },
			{ status: 500 },
		);
	}
}

// POST endpoint to read file content
export async function POST(request: Request) {
	try {
		const { filePath } = await request.json();

		if (!filePath) {
			return NextResponse.json(
				{ error: "File path is required" },
				{ status: 400 },
			);
		}

		// Expand tilde in path if present
		const expandedPath = filePath.startsWith("~")
			? expandTilde(filePath)
			: filePath;

		try {
			const stats = await stat(expandedPath);

			if (stats.isDirectory()) {
				return NextResponse.json(
					{ error: "Cannot read directory content" },
					{ status: 400 },
				);
			}

			const content = await readFile(expandedPath, { encoding: "utf-8" });

			return NextResponse.json({
				path: expandedPath,
				content,
				size: stats.size,
				lastModified: stats.mtime,
			});
		} catch (error) {
			return NextResponse.json(
				{ error: "Failed to read file", details: (error as Error).message },
				{ status: 500 },
			);
		}
	} catch (error) {
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}
}
