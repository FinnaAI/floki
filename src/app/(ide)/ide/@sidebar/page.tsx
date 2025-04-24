"use client";
import { FileTree } from "@/components/ide/file-tree";
import { Button } from "@/components/ui/button";
import { useFileStore } from "@/store/file-store";

export default function Sidebar() {
  const {
    filteredFiles,
    selectedFile,
    loading,
    error,
    searchQuery,
    handleFileClick,
    currentPath,
    setSearchQuery,
    toggleFileSelection,
    isFileSelected,
    goToProjectRoot,
  } = useFileStore();

  return (
    <div className="flex h-full w-20 flex-col gap-2 p-1 w-full h-screen">
      <Button onClick={goToProjectRoot}>Home</Button>
      <FileTree
        files={filteredFiles}
        selectedFile={selectedFile}
        loading={loading}
        error={error}
        searchQuery={searchQuery}
        filteredFiles={filteredFiles}
        handleFileClick={handleFileClick}
        currentPath={currentPath}
        clearSearch={() => setSearchQuery("")}
        toggleFileSelection={toggleFileSelection}
        isFileSelected={isFileSelected}
      />
    </div>
  );
}
