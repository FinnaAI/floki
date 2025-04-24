import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { ReactNode } from "react";
import { useFileStore } from "@/store/file-store";
export default function IDELayout({
  children,
  sidebar,
  editor,
  terminal,
  agent,
}: {
  children: ReactNode;
  sidebar: ReactNode;
  editor: ReactNode;
  terminal: ReactNode;
  agent: ReactNode;
}) {
  const { filteredFiles, searchQuery } = useFileStore.getState();

  return (
    <div className="flex h-screen flex-col">
      <ResizablePanelGroup direction="horizontal" className="h-screen">
        <ResizablePanel defaultSize={20} minSize={10} collapsible>
          {sidebar}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={60} minSize={30}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} minSize={30}>
              {editor}
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={30} minSize={10} collapsible>
              {terminal}
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={20} minSize={10} collapsible>
          {agent}
        </ResizablePanel>
      </ResizablePanelGroup>
      <div className=" border-slate-200 border-t bg-slate-100 px-4 text-slate-500 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
        {filteredFiles.length} items
        {searchQuery && " (filtered)"}
      </div>
    </div>
  );
}
