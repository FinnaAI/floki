import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { NextResponse } from "next/server";

// Function to expand tilde to user home directory
function expandTilde(filePath: string): string {
	if (filePath.startsWith("~")) {
		return path.join(os.homedir(), filePath.slice(1));
	}
	return filePath;
}

// Base path for allowed access: user's home directory
const BASE_PATH = expandTilde("~");

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const filePathParam = searchParams.get("path");
	if (!filePathParam) {
		return NextResponse.json(
			{ error: "Path parameter is required" },
			{ status: 400 },
		);
	}

	let filePath = filePathParam;
	// Expand tilde if present
	if (filePath.startsWith("~")) {
		filePath = expandTilde(filePath);
	} else {
		// Resolve relative paths to project root
		const projectRoot = process.cwd();
		filePath = path.isAbsolute(filePath)
			? filePath
			: path.join(projectRoot, filePath);
	}

	// Ensure the path is within allowed base directory
	const projectRoot = process.cwd();
	if (!filePath.startsWith(BASE_PATH) && !filePath.startsWith(projectRoot)) {
		return NextResponse.json(
			{ error: "Access denied: outside allowed directory" },
			{ status: 403 },
		);
	}

	try {
		const fileData = await fs.readFile(filePath);
		const ext = path.extname(filePath).toLowerCase();
		let contentType = "application/octet-stream";
		switch (ext) {
			case ".png":
				contentType = "image/png";
				break;
			case ".jpg":
			case ".jpeg":
				contentType = "image/jpeg";
				break;
			case ".gif":
				contentType = "image/gif";
				break;
			case ".svg":
				contentType = "image/svg+xml";
				break;
			case ".ico":
				contentType = "image/x-icon";
				break;
			case ".webp":
				contentType = "image/webp";
				break;
			case ".bmp":
				contentType = "image/bmp";
				break;
			case ".tiff":
			case ".tif":
				contentType = "image/tiff";
				break;
		}

		return new NextResponse(fileData, {
			status: 200,
			headers: { "Content-Type": contentType },
		});
	} catch (error) {
		console.error("Error reading image file:", error);
		return NextResponse.json(
			{ error: (error as Error).message },
			{ status: 500 },
		);
	}
}
