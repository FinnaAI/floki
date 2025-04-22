import { IdeLayoutProvider } from "@/components/ide/ide-context";
import { IdeHeader } from "@/components/ide/ide-header";
import { GitStatusProvider, GitStatusBar } from "@/components/ide/git-status";
import { FileProvider } from "@/components/ide/file-context";
import type { ReactNode } from "react";

export default function IDELayout({ children }: { children: ReactNode }) {
  return (
    <GitStatusProvider>
      <FileProvider>
        <IdeLayoutProvider>
          <div className="flex h-screen flex-col">
            <IdeHeader />
            {children}
          </div>
        </IdeLayoutProvider>
      </FileProvider>
    </GitStatusProvider>
  );
}
