import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: { theme: string } },
) {
	try {
		const { theme: themeName } = await params;
		const themePath = path.join(
			process.cwd(),
			"public/themes",
			`${themeName}.json`,
		);

		// Read and parse the theme file
		const themeContent = await fs.readFile(themePath, "utf-8");
		const themeData = JSON.parse(themeContent);

		// Ensure the theme has the required base properties
		const processedTheme = {
			base: themeData.base || "vs-dark",
			inherit: true,
			...themeData,
			rules: themeData.rules || [],
			colors: themeData.colors || {},
		};

		return NextResponse.json(processedTheme);
	} catch (error) {
		console.error("Error loading theme:", error);
		// Return a basic dark theme as fallback
		return NextResponse.json(
			{
				base: "vs-dark",
				inherit: true,
				rules: [],
				colors: {},
			},
			{ status: 500 },
		);
	}
} 