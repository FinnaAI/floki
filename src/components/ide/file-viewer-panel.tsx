"use client";

import React, { useState, useMemo, useCallback } from "react";
import FileViewer from "@/components/FileViewer";
import type { FileInfo, FileDiff } from "@/types/files";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFiles } from "./file-context";

// View types that will be supported
export type ViewType = "code" | "graph" | "components" | "preview";

interface ViewComponentProps {
  selectedFile: FileInfo | null;
  fileContent: string | null;
  fileDiff: FileDiff | null;
  loading: boolean;
  error: string | null;
}

// Standard code view component
const CodeView = React.memo<ViewComponentProps>(
  ({ selectedFile, fileContent, fileDiff, loading, error }) => {
    return (
      <FileViewer
        selectedFile={selectedFile}
        fileContent={fileContent}
        fileDiff={fileDiff}
        loading={loading}
        error={error}
      />
    );
  }
);

CodeView.displayName = "CodeView";

// Placeholder for graph view
const GraphView = React.memo<ViewComponentProps>(
  ({ selectedFile, fileContent, loading, error }) => {
    if (loading) return <div className="p-4">Loading graph...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;
    if (!selectedFile || !fileContent)
      return <div className="p-4">No file selected</div>;

    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">Graph View</h2>
        <p>
          Graph visualization for {selectedFile.name} will be displayed here
        </p>
        {/* Future implementation of graph visualization */}
      </div>
    );
  }
);

GraphView.displayName = "GraphView";

// Placeholder for component structure view
const ComponentsView = React.memo<ViewComponentProps>(
  ({ selectedFile, fileContent, loading, error }) => {
    if (loading) return <div className="p-4">Loading components...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;
    if (!selectedFile || !fileContent)
      return <div className="p-4">No file selected</div>;

    // This could analyze React components in the future
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">Component Structure</h2>
        <p>
          Component hierarchy for {selectedFile.name} will be displayed here
        </p>
        {/* Future implementation of component structure analysis */}
      </div>
    );
  }
);

ComponentsView.displayName = "ComponentsView";

// Placeholder for preview (for HTML, Markdown, etc.)
const PreviewView = React.memo<ViewComponentProps>(
  ({ selectedFile, fileContent, loading, error }) => {
    if (loading) return <div className="p-4">Loading preview...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;
    if (!selectedFile || !fileContent)
      return <div className="p-4">No file selected</div>;

    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">Preview</h2>
        <div className="border p-4">
          {/* Render HTML/Markdown preview here in the future */}
          <p>Preview of {selectedFile.name} will be displayed here</p>
        </div>
      </div>
    );
  }
);

PreviewView.displayName = "PreviewView";

// Map of view types to their components
const viewComponents: Record<ViewType, React.FC<ViewComponentProps>> = {
  code: CodeView,
  graph: GraphView,
  components: ComponentsView,
  preview: PreviewView,
};

interface FileViewerContentProps extends ViewComponentProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

// Create a stable component to prevent rerendering when navigating folders
const FileViewerContent = React.memo<FileViewerContentProps>(
  ({
    selectedFile,
    fileContent,
    fileDiff,
    loading,
    error,
    activeView,
    onViewChange,
  }) => {
    // Determine which view types are available for the current file
    const getAvailableViews = useCallback((): ViewType[] => {
      if (!selectedFile) return ["code"];

      const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "";
      const availableViews: ViewType[] = ["code"];

      // Add graph view for JavaScript/TypeScript files
      if (["js", "jsx", "ts", "tsx"].includes(ext)) {
        availableViews.push("graph");
        availableViews.push("components");
      }

      // Add preview for HTML and Markdown
      if (["html", "md", "markdown"].includes(ext)) {
        availableViews.push("preview");
      }

      return availableViews;
    }, [selectedFile]);

    const availableViews = useMemo(
      () => getAvailableViews(),
      [getAvailableViews]
    );

    // If the current active view is not available, default to code
    React.useEffect(() => {
      if (selectedFile && !availableViews.includes(activeView)) {
        onViewChange("code");
      }
    }, [selectedFile, availableViews, activeView, onViewChange]);

    // Get the appropriate view component
    const ViewComponent = viewComponents[activeView];

    return (
      <div className="flex h-full flex-col overflow-hidden">
        {selectedFile && (
          <div className="border-b border-slate-200 dark:border-slate-700">
            <Tabs
              value={activeView}
              onValueChange={(value) => onViewChange(value as ViewType)}
              className="w-full"
            >
              <TabsList
                className="grid m-2"
                style={{
                  gridTemplateColumns: `repeat(${availableViews.length}, 1fr)`,
                }}
              >
                {availableViews.includes("code") && (
                  <TabsTrigger value="code">Code</TabsTrigger>
                )}
                {availableViews.includes("graph") && (
                  <TabsTrigger value="graph">Dependency Graph</TabsTrigger>
                )}
                {availableViews.includes("components") && (
                  <TabsTrigger value="components">Components</TabsTrigger>
                )}
                {availableViews.includes("preview") && (
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <ViewComponent
            selectedFile={selectedFile}
            fileContent={fileContent}
            fileDiff={fileDiff}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    );
  }
);

FileViewerContent.displayName = "FileViewerContent";

// Main extensible file viewer panel
export const FileViewerPanel: React.FC = () => {
  const { selectedFile, fileContent, fileDiff, loading, error } = useFiles();
  const [activeView, setActiveView] = useState<ViewType>("code");

  // No file selected
  if (!selectedFile && !loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <div className="text-center">
          <p>Select a file to view its contents</p>
        </div>
      </div>
    );
  }

  // Key based on file path if a file is selected, otherwise a constant key
  const stableKey = selectedFile ? selectedFile.path : "no-file-selected";

  return (
    <div key={stableKey} className="h-full">
      <FileViewerContent
        selectedFile={selectedFile}
        fileContent={fileContent}
        fileDiff={fileDiff}
        loading={loading}
        error={error}
        activeView={activeView}
        onViewChange={setActiveView}
      />
    </div>
  );
};
