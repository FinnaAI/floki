"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GitCompare, Eye, EyeOff } from "lucide-react";
import path from "path";

interface GitStatus {
  modified: string[];
  added: string[];
  untracked: string[];
  deleted: string[];
  ignored: string[];
  error?: string;
}

export const GitStatusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [showGitStatus, setShowGitStatus] = useState(true);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [showIgnoredFiles, setShowIgnoredFiles] = useState(false);
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    if (showGitStatus) {
      fetchGitStatus();
    }
  }, [showGitStatus, showIgnoredFiles, currentPath]);

  const fetchGitStatus = async () => {
    try {
      // Ensure we're passing the correct path to the API
      const pathParam = encodeURIComponent(currentPath);

      const response = await fetch(
        `/api/filesystem?path=${pathParam}&git=${showGitStatus}&showIgnored=${showIgnoredFiles}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (data.git) {
        setGitStatus(data.git);
      }
    } catch (err) {
      console.error("Error fetching git status:", err);
    }
  };

  // Toggle git status display
  const toggleGitStatus = () => {
    setShowGitStatus(!showGitStatus);
  };

  // Toggle showing ignored files
  const toggleIgnoredFiles = () => {
    setShowIgnoredFiles(!showIgnoredFiles);
  };

  // Determine file status for styling
  const getFileStatus = (filePath: string): string => {
    if (!gitStatus) return "";

    const relativePath = path
      .relative(currentPath, filePath)
      .replace(/\\/g, "/");

    if (gitStatus.modified.includes(relativePath)) return "modified";
    if (gitStatus.added.includes(relativePath)) return "added";
    if (gitStatus.deleted.includes(relativePath)) return "deleted";
    if (gitStatus.untracked.includes(relativePath)) return "untracked";

    return "";
  };

  // Determine if file is ignored by git
  const isIgnored = (filePath: string): boolean => {
    if (!gitStatus || !gitStatus.ignored || gitStatus.ignored.length === 0)
      return false;

    // Get the relative path for matching
    const relativePath = path
      .relative(currentPath, filePath)
      .replace(/\\/g, "/");

    // File is explicitly in the ignored list
    if (gitStatus.ignored.includes(relativePath)) {
      return true;
    }

    // Check if file is in an ignored directory
    for (const pattern of gitStatus.ignored) {
      // Direct match
      if (relativePath === pattern) {
        return true;
      }

      // Directory match (if pattern ends with /)
      if (pattern.endsWith("/") && relativePath.startsWith(pattern)) {
        return true;
      }

      // Handle wildcards for specific file extensions
      if (
        pattern.startsWith("*.") &&
        relativePath.endsWith(pattern.substring(1))
      ) {
        return true;
      }

      // Pattern with wildcards - convert to regex
      if (pattern.includes("*")) {
        const regexPattern = new RegExp(
          `^${pattern.replace(/\*/g, ".*").replace(/\?/g, ".")}$`
        );
        if (regexPattern.test(relativePath)) {
          return true;
        }
      }
    }

    return false;
  };

  // Context value
  const gitContext = {
    showGitStatus,
    gitStatus,
    showIgnoredFiles,
    toggleGitStatus,
    toggleIgnoredFiles,
    getFileStatus,
    isIgnored,
    setCurrentPath,
  };

  return (
    <GitStatusContext.Provider value={gitContext}>
      {children}
    </GitStatusContext.Provider>
  );
};

// Create the context
export const GitStatusContext = React.createContext<{
  showGitStatus: boolean;
  gitStatus: GitStatus | null;
  showIgnoredFiles: boolean;
  toggleGitStatus: () => void;
  toggleIgnoredFiles: () => void;
  getFileStatus: (filePath: string) => string;
  isIgnored: (filePath: string) => boolean;
  setCurrentPath: (path: string) => void;
}>({
  showGitStatus: true,
  gitStatus: null,
  showIgnoredFiles: false,
  toggleGitStatus: () => {},
  toggleIgnoredFiles: () => {},
  getFileStatus: () => "",
  isIgnored: () => false,
  setCurrentPath: () => {},
});

// Custom hook for using git status
export const useGitStatus = () => React.useContext(GitStatusContext);

// Git status UI component
export const GitStatusBar: React.FC = () => {
  const {
    showGitStatus,
    gitStatus,
    showIgnoredFiles,
    toggleGitStatus,
    toggleIgnoredFiles,
  } = useGitStatus();

  return (
    <div className="flex items-center space-x-2 px-2">
      <Button
        variant={showGitStatus ? "default" : "outline"}
        size="sm"
        onClick={toggleGitStatus}
        className="h-8 rounded-full px-3"
        title="Toggle Git status"
      >
        <GitCompare size={16} className="mr-1" />
        <span>Git</span>
      </Button>

      {showGitStatus && (
        <Button
          variant={showIgnoredFiles ? "default" : "outline"}
          size="sm"
          onClick={toggleIgnoredFiles}
          className="h-8 rounded-full px-3"
          title="Toggle showing ignored files"
        >
          {showIgnoredFiles ? (
            <EyeOff size={16} className="mr-1" />
          ) : (
            <Eye size={16} className="mr-1" />
          )}
          <span>Ignored</span>
        </Button>
      )}

      {/* Status indicators */}
      {showGitStatus && gitStatus && (
        <div className="flex space-x-3 text-xs">
          {gitStatus.modified.length > 0 && (
            <span className="text-amber-500 dark:text-amber-400">
              {gitStatus.modified.length} modified
            </span>
          )}
          {gitStatus.added.length > 0 && (
            <span className="text-green-500 dark:text-green-400">
              {gitStatus.added.length} added
            </span>
          )}
          {gitStatus.deleted.length > 0 && (
            <span className="text-red-500 dark:text-red-400">
              {gitStatus.deleted.length} deleted
            </span>
          )}
          {gitStatus.untracked.length > 0 && (
            <span className="text-blue-500 dark:text-blue-400">
              {gitStatus.untracked.length} untracked
            </span>
          )}
          {gitStatus.ignored && gitStatus.ignored.length > 0 && (
            <span className="text-slate-500 dark:text-slate-400">
              {showIgnoredFiles ? gitStatus.ignored.length : "?"} ignored
            </span>
          )}
        </div>
      )}
    </div>
  );
};
