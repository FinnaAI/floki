import Image from "next/image";
import React from "react";
import type { FileInfo } from "../types";

interface ImageViewerProps {
	selectedFile: FileInfo;
	fileContent: string | null;
}

export const ImageViewer = React.memo(
	({ selectedFile, fileContent }: ImageViewerProps) => {
		const isSvg = selectedFile.name.toLowerCase().endsWith(".svg");

		if (!fileContent) {
			return <div className="text-slate-500">Image could not be loaded</div>;
		}

		return (
			<div className="relative">
				{isSvg ? (
					<div
						dangerouslySetInnerHTML={{ __html: fileContent }}
						className="svg-container max-h-[70vh] max-w-full"
					/>
				) : (
					<Image
						src={`/api/file/image?path=${encodeURIComponent(selectedFile.path)}`}
						alt={selectedFile.name}
						width={800}
						height={600}
						className="max-h-[70vh] max-w-full object-contain"
						style={{ height: "auto" }}
					/>
				)}
			</div>
		);
	},
);

ImageViewer.displayName = "ImageViewer";
