import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export async function GET() {
  try {
    const themesDir = path.join(process.cwd(), "public/themes");
    const files = await fs.readdir(themesDir);

    // Filter for .json files and remove the extension
    const themes = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(".json", ""))
      // Sort alphabetically but keep OneDark-Pro variants at the top
      .sort((a, b) => {
        return a.localeCompare(b);
      });

    return NextResponse.json({ themes });
  } catch (error) {
    console.error("Error reading themes directory:", error);
    return NextResponse.json({ themes: [] }, { status: 500 });
  }
}
