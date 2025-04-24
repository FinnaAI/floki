import { create } from "zustand";
import path from "path";

interface GitStatus {
  modified: string[];
  added: string[];
  untracked: string[];
  deleted: string[];
  ignored: string[];
  error?: string;
}

interface GitStatusState {
  // State
  showGitStatus: boolean;
  gitStatus: GitStatus | null;
  showIgnoredFiles: boolean;
  currentPath: string;

  // Actions
  toggleGitStatus: () => void;
  toggleIgnoredFiles: () => void;
  setCurrentPath: (path: string) => void;
  fetchGitStatus: () => Promise<void>;
  getFileStatus: (filePath: string) => string;
  isIgnored: (filePath: string) => boolean;
}

export const useGitStatusStore = create<GitStatusState>((set, get) => ({
  // Initial state
  showGitStatus: true,
  gitStatus: null,
  showIgnoredFiles: false,
  currentPath: "",

  // Actions
  toggleGitStatus: () =>
    set((state) => ({ showGitStatus: !state.showGitStatus })),

  toggleIgnoredFiles: () =>
    set((state) => ({ showIgnoredFiles: !state.showIgnoredFiles })),

  setCurrentPath: (path: string) => set({ currentPath: path }),

  fetchGitStatus: async () => {
    const { showGitStatus, showIgnoredFiles, currentPath } = get();

    if (!showGitStatus) return;

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
        set({ gitStatus: data.git });
      }
    } catch (err) {
      console.error("Error fetching git status:", err);
    }
  },

  getFileStatus: (filePath: string): string => {
    const { gitStatus, currentPath } = get();
    if (!gitStatus) return "";

    const relativePath = path
      .relative(currentPath, filePath)
      .replace(/\\/g, "/");

    if (gitStatus.modified.includes(relativePath)) return "modified";
    if (gitStatus.added.includes(relativePath)) return "added";
    if (gitStatus.deleted.includes(relativePath)) return "deleted";
    if (gitStatus.untracked.includes(relativePath)) return "untracked";

    return "";
  },

  isIgnored: (filePath: string): boolean => {
    const { gitStatus, currentPath } = get();
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
  },
}));
