import { BrowserFileSystem } from "./browser-file-system";
import { ServerFileSystem } from "./server-file-system";
export function createFileSystem(options = {}) {
    // Check if we're in a browser environment and File System Access API is available
    const isBrowser = typeof window !== "undefined";
    const hasFileSystemAccess = isBrowser && "showDirectoryPicker" in window;
    if (hasFileSystemAccess) {
        return new BrowserFileSystem(options);
    }
    return new ServerFileSystem(options);
}
export { BrowserFileSystem } from "./browser-file-system";
export { ServerFileSystem } from "./server-file-system";
