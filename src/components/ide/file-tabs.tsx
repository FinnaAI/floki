import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFileIcon } from "@/lib/file-utils";
import { useFileStore } from "@/store/file-store";
import { useIDEStore } from "@/store/ide-store";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { cn } from "@/lib/utils";

// Custom hook to track scroll indicators
function useScrollIndicators(ref: React.RefObject<HTMLDivElement | null>) {
	const [showLeft, setShowLeft] = useState(false);
	const [showRight, setShowRight] = useState(false);

	useEffect(() => {
		const checkScroll = () => {
			const element = ref.current;
			if (!element) return;

			const hasScrollLeft = element.scrollLeft > 0;
			const hasScrollRight =
				element.scrollLeft < element.scrollWidth - element.clientWidth;

			setShowLeft(hasScrollLeft);
			setShowRight(hasScrollRight);
		};

		const element = ref.current;
		if (!element) return;

		// Check on mount and whenever content changes
		checkScroll();

		// Add scroll event listener
		element.addEventListener("scroll", checkScroll);
		// Add resize observer to check when width changes
		const resizeObserver = new ResizeObserver(checkScroll);
		resizeObserver.observe(element);

		return () => {
			element.removeEventListener("scroll", checkScroll);
			resizeObserver.disconnect();
		};
	}, [ref]);

	return { showLeft, showRight };
}

export function FileTabs() {
	// Get file tabs from IDE store
	const { openTabs, activeTab, closeFileTab, setActiveFileTab } = useIDEStore(
		useShallow((state) => ({
			openTabs: state.getOpenTabs(),
			activeTab: state.getActiveFileTab(),
			closeFileTab: state.closeFileTab,
			setActiveFileTab: state.setActiveFileTab,
		})),
	);

	// Get file loading state and file content loading function
	const { fileLoading, loadFileContent } = useFileStore(
		useShallow((state) => ({
			fileLoading: state.fileLoading,
			loadFileContent: state.loadFileContent,
		})),
	);

	// Ref for the active tab element and tabs list
	const activeTabRef = useRef<HTMLButtonElement>(null);
	const tabsListRef = useRef<HTMLDivElement>(null);
	const { showLeft, showRight } = useScrollIndicators(tabsListRef);

	// Auto-scroll to active tab when it changes
	useEffect(() => {
		const scrollToTab = () => {
			if (activeTabRef.current) {
				activeTabRef.current.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
					inline: "nearest",
				});
			}
		};
		scrollToTab();
	}, []);

	// Handle tab click
	const handleTabChange = useCallback(
		(tabId: string) => {
			// Set active tab in store
			setActiveFileTab(tabId);

			// Find the file in open tabs
			const fileTab = openTabs.find((tab) => tab.id === tabId);
			if (fileTab) {
				// Load file content using the path
				loadFileContent({
					path: fileTab.path,
					name: fileTab.name,
					isDirectory: false,
					lastModified: new Date(),
					size: 0,
				});
			}
		},
		[openTabs, setActiveFileTab, loadFileContent],
	);

	// Handle tab close button click
	const handleCloseTab = useCallback(
		(e: React.MouseEvent, tabId: string) => {
			// Stop both the click and mousedown events from bubbling
			e.preventDefault();
			e.stopPropagation();
			closeFileTab(tabId);
		},
		[closeFileTab],
	);

	// If no tabs are open, don't render the component
	if (openTabs.length === 0) {
		return null;
	}

	return (
		<Tabs
			value={activeTab || undefined}
			onValueChange={handleTabChange}
			className="w-full"
		>
			<div className="relative mx-2 w-ful">
				{/* Left fade indicator */}
				{showLeft && (
					<div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-24 bg-gradient-to-r from-background/50 to-transparent" />
				)}

				{/* Right fade indicator */}
				{showRight && (
					<div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-24 bg-gradient-to-l from-background/50 to-transparent" />
				)}

				<TabsList
					ref={tabsListRef}
					className="flex w-full flex-nowrap justify-start overflow-x-auto scroll-smooth bg-transparent p-0"
				>
					{openTabs.map((tab) => (
						<TabsTrigger
							key={tab.id}
							value={tab.id}
							ref={tab.id === activeTab ? activeTabRef : null}
							className={cn(
								"relative mx-0.5 flex shrink-0 items-center gap-1 px-2 py-1.5",
								activeTab === tab.id ? "bg-neutral-800" : "bg-neutral-900",
							)}
							disabled={fileLoading}
							onClick={(e) => {
								// Only handle tab activation if the click wasn't on the close button
								if (!(e.target as HTMLElement).closest("button")) {
									handleTabChange(tab.id);
								}
							}}
						>
							<div className="mr-1">{getFileIcon(tab.name)}</div>
							<span className="max-w-[120px] truncate text-sm">{tab.name}</span>
							<Button
								onClick={(e) => handleCloseTab(e, tab.id)}
								onMouseDown={(e) => {
									e.preventDefault();
									e.stopPropagation();
								}}
								onMouseUp={(e) => {
									e.preventDefault();
									e.stopPropagation();
								}}
								className="ml-1 rounded-full p-1 hover:bg-neutral-700"
								variant="ghost"
								size="icon"
								style={{ pointerEvents: "auto" }}
							>
								<X className="h-3 w-3" />
							</Button>
						</TabsTrigger>
					))}
				</TabsList>
			</div>
		</Tabs>
	);
}
