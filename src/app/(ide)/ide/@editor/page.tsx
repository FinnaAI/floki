import { FileViewerPanel } from "@/components/ide/file-viewer-panel";

export default function Editor() {
  return (
    <div className="flex flex-col h-full">
      <FileViewerPanel />
    </div>
  );
}
