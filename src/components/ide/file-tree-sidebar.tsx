"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileTree } from "@/components/ide/file-tree";
import { useFileStore } from "@/store/file-store";

export function FileTreeSidebar() {
  const {
    files,
    filteredFiles,
    selectedFile,
    loading,
    error,
    searchQuery,
    handleFileClick,
    currentPath,
    toggleFileSelection,
    isFileSelected,
    // clearSearch,
  } = useFileStore();

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="!h-[calc(100svh-var(--header-height))] top-[--header-height]"
    >
      <SidebarHeader>
        {/* <SidebarTrigger size="icon" /> */}
        <span className="ml-2 font-semibold">Files</span>
      </SidebarHeader>

      <SidebarContent className="p-0">
        <ScrollArea className="h-full">
          <FileTree
            files={files}
            filteredFiles={filteredFiles}
            selectedFile={selectedFile}
            loading={loading}
            error={error}
            searchQuery={searchQuery}
            currentPath={currentPath}
            clearSearch={() => {}}
          />
        </ScrollArea>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
