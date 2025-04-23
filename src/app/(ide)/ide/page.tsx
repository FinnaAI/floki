"use client";

// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import path from "path";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  RefreshCcw,
  Search,
  Clipboard,
  FilesIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { useIdeLayout } from "@/components/ide/ide-context";
import { useFiles } from "@/components/ide/file-context";
import { FileTree } from "@/components/ide/file-tree";
import { FileViewerPanel } from "@/components/ide/file-viewer-panel";
import { TerminalPanel } from "@/components/ide/terminal-panel";
import { Codex } from "@/components/terminal/Codex";
import { GitStatusBar } from "@/components/ide/git-status";
import { SelectedFilesBar } from "@/components/ide/selected-files-bar";

export default function BrowserPage() {
  const { showFileTree, showFileContent, showTerminal, showCodex } =
    useIdeLayout();
  // Compute default panel sizes (percentages) so they sum to 100 and avoid overflow
  const treeSize = showFileTree ? 15 : 0;
  const terminalSize = showTerminal ? 25 : 0;
  const codexSize = showCodex ? 15 : 0;
  // Content panel takes remaining space
  const contentSize = 100 - treeSize - terminalSize - codexSize;
  const {
    filteredFiles,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    selectedFile,
    pathHistory,
    pathForward,
    handleFileClick,
    goBack,
    goForward,
    navigateUp,
    goToProjectRoot,
    refreshDirectory,
    getBreadcrumbs,
    currentPath,
    toggleFileSelection,
    isFileSelected,
    selectedFiles,
    clearSelectedFiles,
  } = useFiles();

  return (
    <div className="h-[calc(100dvh-3rem)] w-full overflow-hidden">
      {/* Main container with overflow hidden to prevent whole page scrolling */}
      <div className="flex h-full flex-col overflow-hidden dark:bg-slate-900">
        {/* Navigation Bar with controls and search */}
        <div className="flex flex-row justify-between border-slate-200 border-b px-4 py-3 dark:border-slate-800">
          <div className="flex w-full flex-row justify-between gap-2 p-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={goBack}
                disabled={pathHistory.length === 0}
                className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Back"
              >
                <ChevronLeft size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goForward}
                disabled={pathForward.length === 0}
                className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Forward"
              >
                <ChevronRight size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={navigateUp}
                className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Up one level"
              >
                <ChevronLeft size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToProjectRoot}
                className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Project root"
              >
                <Home size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshDirectory}
                className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Refresh"
              >
                <RefreshCcw size={18} />
              </Button>
              <div className="relative ml-2 flex-1">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pr-4 pl-8 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              {selectedFiles.length > 0 && (
                <SelectedFilesBar
                  selectedFiles={selectedFiles}
                  currentPath={currentPath}
                  clearSelectedFiles={clearSelectedFiles}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-row justify-between border-slate-200 border-b px-4 py-1 dark:border-slate-800">
          {/* Breadcrumbs */}
          <Breadcrumb className="flex max-w-full items-center overflow-x-auto py-1 text-xs [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <BreadcrumbList className="whitespace-nowrap">
              {getBreadcrumbs().map((crumb, index, array) => (
                <React.Fragment key={crumb.path}>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      asChild
                      className={
                        index === array.length - 1
                          ? "font-medium text-blue-600 dark:text-blue-400"
                          : ""
                      }
                      aria-current={
                        index === array.length - 1 ? "page" : undefined
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleFileClick({
                            path: crumb.path,
                            name: crumb.name,
                            isDirectory: true,
                            size: 0,
                            lastModified: new Date(),
                          })
                        }
                      >
                        {crumb.name}
                      </button>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {index < array.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-2">
            {/* <GitStatusBar /> */}
          </div>
        </div>

        {/* Main Content - ResizablePanelGroup */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* File Browser Panel */}
          {showFileTree && (
            <>
              <ResizablePanel defaultSize={treeSize} minSize={10} maxSize={50}>
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
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* File Content Panel */}
          {showFileContent && (
            <>
              <ResizablePanel defaultSize={contentSize} minSize={20}>
                <FileViewerPanel />
              </ResizablePanel>
              {showTerminal && <ResizableHandle withHandle />}
            </>
          )}

          {/* Terminal Panel */}
          {showTerminal && (
            <>
              <ResizablePanel defaultSize={terminalSize} minSize={20}>
                <TerminalPanel />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Codex Panel */}
          {showCodex && (
            <ResizablePanel defaultSize={codexSize} minSize={20}>
              <Codex />
            </ResizablePanel>
          )}
        </ResizablePanelGroup>

        {/* Footer/status bar */}
        <div className="flex h-8 items-center justify-between border-slate-200 border-t bg-slate-100 px-4 text-slate-500 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          <div>
            {filteredFiles.length} items
            {searchQuery && " (filtered)"}
          </div>
        </div>
      </div>
    </div>
  );
}
