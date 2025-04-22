import { useMemo } from "react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FileDiff {
  oldContent: string;
  newContent: string;
  hunks: {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: string[];
  }[];
}

interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  lastModified: Date;
}

interface FileViewerProps {
  selectedFile: FileInfo | null;
  fileContent: string | null;
  fileDiff: FileDiff | null;
  loading: boolean;
  error: string | null;
  gitStatus?: {
    modified: string[];
    added: string[];
    untracked: string[];
    deleted: string[];
    ignored: string[];
  } | null;
  currentPath?: string;
}

// Format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const FileViewer = ({
  selectedFile,
  fileContent,
  fileDiff,
  loading,
  error,
  gitStatus,
  currentPath = "",
}: FileViewerProps) => {
  // Determine if this is an image file
  const isImageFile = useMemo(() => {
    if (!selectedFile?.name) return false;
    const imageExtensions = [
      "png",
      "jpg",
      "jpeg",
      "gif",
      "svg",
      "ico",
      "webp",
      "bmp",
      "tiff",
    ];
    const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "";
    return imageExtensions.includes(ext);
  }, [selectedFile]);

  // Determine language for syntax highlighting
  const getLanguage = useMemo(() => {
    if (!selectedFile?.name) return "text";
    const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "";

    // Map file extensions to language identifiers
    const languageMap: Record<string, string> = {
      js: "javascript",
      jsx: "jsx",
      ts: "typescript",
      tsx: "tsx",
      html: "html",
      css: "css",
      scss: "scss",
      json: "json",
      md: "markdown",
      py: "python",
      rb: "ruby",
      java: "java",
      c: "c",
      cpp: "cpp",
      cs: "csharp",
      go: "go",
      php: "php",
      rs: "rust",
      swift: "swift",
      sh: "bash",
      yml: "yaml",
      yaml: "yaml",
      xml: "xml",
      sql: "sql",
      graphql: "graphql",
      kt: "kotlin",
      dart: "dart",
    };

    return languageMap[ext] || "text";
  }, [selectedFile]);

  // Determine file git status
  const getFileStatus = useMemo(() => {
    if (!selectedFile || !gitStatus || !currentPath) return null;

    // Get the relative path for matching
    const relativePath = selectedFile.path
      .replace(currentPath, "")
      .replace(/^\/+/, ""); // Remove leading slashes

    if (gitStatus.modified.includes(relativePath)) return "modified";
    if (gitStatus.added.includes(relativePath)) return "added";
    if (gitStatus.deleted.includes(relativePath)) return "deleted";
    if (gitStatus.untracked.includes(relativePath)) return "untracked";

    return null;
  }, [selectedFile, gitStatus, currentPath]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-9 flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center text-sm">
          {selectedFile ? (
            <span className="font-medium truncate">
              {selectedFile.name}
              <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                {formatFileSize(selectedFile.size)}
              </span>
            </span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">
              No file selected
            </span>
          )}
        </div>

        {/* Git Status Badge */}
        {selectedFile && gitStatus && getFileStatus && (
          <div className="flex items-center">
            {getFileStatus === "modified" && (
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
              >
                Modified
              </Badge>
            )}
            {getFileStatus === "added" && (
              <Badge
                variant="outline"
                className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
              >
                Added
              </Badge>
            )}
            {getFileStatus === "deleted" && (
              <Badge
                variant="outline"
                className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
              >
                Deleted
              </Badge>
            )}
            {getFileStatus === "untracked" && (
              <Badge
                variant="outline"
                className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
              >
                Untracked
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* File content scroll area */}
      <ScrollArea className="h-full">
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center items-center h-24 text-slate-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2" />
              Loading...
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-24 text-red-500">
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                Error: {error}
              </div>
            </div>
          ) : !selectedFile ? (
            <div className="flex flex-col justify-center items-center h-64 text-slate-500">
              <FileText
                size={48}
                className="text-slate-300 dark:text-slate-700 mb-4"
              />
              <p className="text-xl font-medium">
                Select a file to view its contents
              </p>
              <p className="mt-2 text-sm">
                Choose a file from the browser on the left
              </p>
            </div>
          ) : (
            <>
              {/* Show Git Diff if available */}
              {fileDiff && fileDiff.hunks.length > 0 && (
                <div className="mb-6 border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 font-medium">
                    Git Diff
                  </div>
                  <div className="p-4 overflow-x-auto max-h-[40vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <pre className="text-sm font-mono overflow-visible">
                      {fileDiff.hunks.map((hunk, hunkIndex) => (
                        <div key={hunkIndex} className="mb-4">
                          <div className="text-slate-500 dark:text-slate-400 mb-2">
                            @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart}
                            ,{hunk.newLines} @@
                          </div>
                          {hunk.lines.map((line, lineIndex) => (
                            <div
                              key={lineIndex}
                              className={cn(
                                line.startsWith("+")
                                  ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                                  : line.startsWith("-")
                                  ? "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                                  : ""
                              )}
                            >
                              {line}
                            </div>
                          ))}
                        </div>
                      ))}
                    </pre>
                  </div>
                </div>
              )}

              {/* Show File Content - Image or Text */}
              <div className="border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 font-medium">
                  File Content
                </div>
                <div
                  className={cn(
                    "p-4 overflow-x-auto",
                    isImageFile ? "flex justify-center" : ""
                  )}
                >
                  {isImageFile ? (
                    fileContent ? (
                      <div className="relative">
                        {/* SVG files have raw content */}
                        {selectedFile.name.toLowerCase().endsWith(".svg") ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: fileContent }}
                            className="max-w-full max-h-[70vh] svg-container"
                          />
                        ) : (
                          /* For other image types, use data URL or Next.js Image */
                          <Image
                            src={`/api/file/image?path=${encodeURIComponent(
                              selectedFile.path
                            )}`}
                            alt={selectedFile.name}
                            width={800}
                            height={600}
                            className="object-contain max-h-[70vh] max-w-full"
                            style={{ height: "auto" }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-500">
                        Image could not be loaded
                      </div>
                    )
                  ) : (
                    <SyntaxHighlighter
                      language={getLanguage}
                      customStyle={{
                        margin: 0,
                        padding: 0,
                        background: "transparent",
                      }}
                      className="text-sm font-mono whitespace-pre-wrap overflow-visible"
                    >
                      {fileContent || ""}
                    </SyntaxHighlighter>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FileViewer;
