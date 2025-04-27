import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

interface FileBreadcrumbProps {
	filePath: string;
	currentPath?: string;
}

export const FileBreadcrumb = React.memo(
	({ filePath, currentPath = "" }: FileBreadcrumbProps) => {
		// Remove currentPath prefix if present
		let displayPath = filePath;
		if (currentPath && displayPath.startsWith(currentPath)) {
			displayPath = displayPath.slice(currentPath.length);
			// Remove leading slash if present
			if (displayPath.startsWith("/")) {
				displayPath = displayPath.slice(1);
			}
		}

		const pathParts = displayPath.split("/").filter(Boolean);

		return (
			<Breadcrumb className="flex-1 overflow-hidden">
				<BreadcrumbList className="flex-wrap">
					{pathParts.map((part, index) => {
						const isLast = index === pathParts.length - 1;
						// Create a compound key using the part and its path up to this point
						const keyPath = pathParts.slice(0, index + 1).join("/");
						return (
							<React.Fragment key={keyPath}>
								{index > 0 && <BreadcrumbSeparator />}
								<BreadcrumbItem>
									{isLast ? (
										<BreadcrumbPage className="truncate font-medium">
											{part}
										</BreadcrumbPage>
									) : (
										<BreadcrumbLink className="truncate">{part}</BreadcrumbLink>
									)}
								</BreadcrumbItem>
							</React.Fragment>
						);
					})}
				</BreadcrumbList>
			</Breadcrumb>
		);
	},
);

FileBreadcrumb.displayName = "FileBreadcrumb";
