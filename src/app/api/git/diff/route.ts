import type { FileDiff } from "@/types/files";
import { execSync } from "node:child_process";
import path from "node:path";

interface GitDiffResponse {
  error?: string;
  diff?: FileDiff;
}

function getGitDiff(filePath: string): GitDiffResponse {
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    const diffOutput = execSync(`git diff ${absolutePath}`, {
      encoding: "utf-8",
    });

    if (!diffOutput.trim()) {
      return { error: "No changes detected in the file" };
    }

    const hunks = parseDiff(diffOutput);
    return {
      diff: {
        hunks,
        oldContent: "", // These will be populated by the client
        newContent: "", // These will be populated by the client
      },
    };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

function parseDiff(diffOutput: string): FileDiff["hunks"] {
  const hunks: FileDiff["hunks"] = [];
  let currentHunk: FileDiff["hunks"][0] | null = null;

  const lines = diffOutput.split("\n");
  for (const line of lines) {
    // Skip git diff header lines
    if (
      line.startsWith("diff --git") ||
      line.startsWith("index") ||
      line.startsWith("+++") ||
      line.startsWith("---")
    ) {
      continue;
    }

    // Start of a new hunk
    if (line.startsWith("@@")) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }

      const match = line.match(/@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@/);
      if (!match) continue;

      const [, oldStart = "1", oldLines = "0", newStart = "1", newLines = "0"] =
        match;

      currentHunk = {
        oldStart: Number.parseInt(oldStart, 10),
        oldLines: Number.parseInt(oldLines, 10),
        newStart: Number.parseInt(newStart, 10),
        newLines: Number.parseInt(newLines, 10),
        lines: [],
      };
      continue;
    }

    // Add lines to current hunk
    if (currentHunk) {
      const prefix = line[0] || " ";
      const content = line.slice(1) || "";

      if (prefix === "+") {
        currentHunk.lines.push({ type: "add", content });
      } else if (prefix === "-") {
        currentHunk.lines.push({ type: "remove", content });
      } else {
        currentHunk.lines.push({ type: "context", content });
      }
    }
  }

  // Add the last hunk
  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
}

export async function POST(request: Request) {
  const { filePath } = await request.json();

  if (!filePath) {
    return Response.json({ error: "File path is required" });
  }

  const result = getGitDiff(filePath);
  if (result.error) {
    return Response.json({ error: result.error });
  }

  return Response.json(result);
}
