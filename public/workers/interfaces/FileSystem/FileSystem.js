// Type guards
export function isWebFileSystem(fs) {
    return typeof fs === "object" && fs !== null && "folderHandle" in fs;
}
export function isElectronFileSystem(fs) {
    return typeof fs === "object" && fs !== null && "setPath" in fs;
}
