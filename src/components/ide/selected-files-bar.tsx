"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clipboard, X, FilesIcon } from "lucide-react";
import type { FileInfo } from "@/types/files";
// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import path from "path";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SelectedFilesBarProps {
  selectedFiles: FileInfo[];
  currentPath: string;
  clearSelectedFiles: () => void;
}

export function SelectedFilesBar({
  selectedFiles,
  currentPath,
  clearSelectedFiles,
}: SelectedFilesBarProps) {
  // Format as relative paths to project root
  const formatAsPaths = () => {
    return selectedFiles.map((file) => file.path).join("\n");
  };

  // Format as file map in the requested XML format
  const formatAsFileMap = () => {
    // Generate tree structure
    let result = "<file_map>\n";
    result += `${currentPath}\n`;

    // Simple list of files
    const sortedFiles = [...selectedFiles].sort((a, b) =>
      a.path.localeCompare(b.path)
    );

    // Just print each file path
    sortedFiles.forEach((file, index) => {
      const prefix = index === sortedFiles.length - 1 ? "└── " : "├── ";
      result += `${prefix}${file.path}\n`;
    });

    result += "\n</file_map>\n";
    return result;
  };

  // Format as file contents in the requested XML format
  const formatAsFileContents = async () => {
    let result = "";

    for (const file of selectedFiles) {
      if (file.isDirectory) continue;

      try {
        const response = await fetch("/api/filesystem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filePath: file.path }),
        });

        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const data = await response.json();

        result += "<file_contents>\n";
        result += `File: ${file.path}\n`;
        const fileExt = getFileExtension(file.path);
        result += `\`\`\`${fileExt}\n`;
        result += data.content;
        result += "\n```\n";
        result += "</file_contents>\n\n";
      } catch (error) {
        console.error(`Error loading file ${file.path}:`, error);
      }
    }

    return result;
  };

  // Get file extension for syntax highlighting
  const getFileExtension = (filePath: string) => {
    const ext = path.extname(filePath || "").slice(1);

    switch (ext) {
      case "js":
        return "javascript";
      case "ts":
        return "typescript";
      case "tsx":
        return "tsx";
      case "jsx":
        return "jsx";
      case "py":
        return "python";
      case "go":
        return "go";
      case "rs":
        return "rust";
      case "rb":
        return "ruby";
      case "java":
        return "java";
      case "php":
        return "php";
      case "cs":
        return "csharp";
      case "c":
        return "c";
      case "cpp":
        return "cpp";
      case "html":
        return "html";
      case "css":
        return "css";
      case "scss":
        return "scss";
      case "md":
        return "markdown";
      case "json":
        return "json";
      case "yml":
      case "yaml":
        return "yaml";
      case "sh":
        return "bash";
      default:
        return "";
    }
  };

  // Copy to clipboard and show feedback
  const copyToClipboard = async (format: "paths" | "map" | "contents") => {
    try {
      let content = "";

      if (format === "paths") {
        content = formatAsPaths();
      } else if (format === "map") {
        content = formatAsFileMap();
      } else if (format === "contents") {
        content = await formatAsFileContents();
      }

      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-slate-500 dark:text-slate-400">
        {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""}{" "}
        selected
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyToClipboard("paths")}
          className="h-8 rounded-full px-3"
          title="Copy file paths"
        >
          <Clipboard size={16} className="mr-1" />
          <span>Copy paths</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => copyToClipboard("map")}
          className="h-8 rounded-full px-3"
          title="Copy as file map"
        >
          <FilesIcon size={16} className="mr-1" />
          <span>Copy map</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => copyToClipboard("contents")}
          className="h-8 rounded-full px-3"
          title="Copy file contents"
        >
          <FilesIcon size={16} className="mr-1" />
          <span>Copy contents</span>
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelectedFiles}
                className="h-8 rounded-full px-2"
              >
                <X size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear selection</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
