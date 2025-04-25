import { FileViewerPanel } from "@/components/ide/file-viewer-panel";

export default function Editor() {
	return (
		<div className="flex h-full flex-col">
			<FileViewerPanel />
		</div>
	);
}
