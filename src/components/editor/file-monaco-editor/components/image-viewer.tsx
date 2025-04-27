import Image from "next/image";
import React, { useMemo } from "react";
import type { FileInfo } from "../types";

interface ImageViewerProps {
	selectedFile: FileInfo;
	fileContent: string | null;
}

export const ImageViewer = React.memo(
	({ selectedFile, fileContent }: ImageViewerProps) => {
		const isSvg = selectedFile.name.toLowerCase().endsWith(".svg");

		// Validate SVG content
		const validatedSvgContent = useMemo(() => {
			if (!isSvg || !fileContent) return null;

			try {
				// Create a DOMParser to validate SVG
				const parser = new DOMParser();
				const doc = parser.parseFromString(fileContent, "image/svg+xml");
				
				// Check for parsing errors
				const parserError = doc.querySelector("parsererror");
				if (parserError) {
					throw new Error("Invalid SVG content");
				}

				// Basic security checks
				const scriptTags = doc.getElementsByTagName("script");
				if (scriptTags.length > 0) {
					throw new Error("SVG contains potentially unsafe script tags");
				}

				// Check for potentially harmful attributes
				const elements = doc.getElementsByTagName("*");
				for (const element of Array.from(elements)) {
					const attrs = element.attributes;
					for (const attr of Array.from(attrs)) {
						if (
							attr.name.toLowerCase().startsWith("on") || // event handlers
							attr.value.toLowerCase().includes("javascript:") || // javascript: URLs
							attr.value.toLowerCase().includes("data:") // data: URLs
						) {
							throw new Error("SVG contains potentially unsafe attributes");
						}
					}
				}

				return fileContent;
			} catch (error) {
				console.error("SVG validation error:", error);
				return null;
			}
		}, [isSvg, fileContent]);

		if (!fileContent) {
			return (
				<div className="flex items-center justify-center p-4 text-slate-500">
					<div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
						Image could not be loaded
					</div>
				</div>
			);
		}

		return (
			<div className="relative">
				{isSvg ? (
					validatedSvgContent ? (
						// biome-ignore lint/security/noDangerouslySetInnerHTML: SVG content is validated and sanitized above
						<div
							dangerouslySetInnerHTML={{ __html: validatedSvgContent }}
							className="svg-container max-h-[70vh] max-w-full"
						/>
					) : (
						<div className="flex items-center justify-center p-4 text-red-500">
							<div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
								Invalid or potentially unsafe SVG content
							</div>
						</div>
					)
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
