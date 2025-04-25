export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  lastModified: Date;
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle; // For browser
  deleted?: boolean; // For tracking deletions
  isLarge?: boolean; // For large directories that should be lazy loaded
}

export interface FileSystem {
  folderHandle?: FileSystemDirectoryHandle | null; // Current folder handle for browser
  openFolder?(): Promise<FileSystemDirectoryHandle>; // Browser-only
  listFiles(path: string, recursive?: boolean): Promise<FileInfo[]>;
  readFile(path: string): Promise<{ content: string; info: FileInfo }>;
  writeFile(path: string, content: string): Promise<FileInfo>;
  watchChanges?(
    path: string,
    callback: (changes: FileInfo[]) => void
  ): () => void; // Optional for syncing
}

export interface FileSystemOptions {
  basePath?: string;
  pollInterval?: number; // For browser file system
  allowedPaths?: string[]; // For server file system
  excludePatterns?: string[]; // For both
}
