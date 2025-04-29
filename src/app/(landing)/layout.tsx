import Header from "@/components/layout/Header";
import { ClerkProvider } from "@clerk/nextjs";

export default function LandingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ClerkProvider>
			<div className="flex flex-col">
				<Header className="fixed top-0 right-0 left-0 z-50 border-border border-b bg-background/90 backdrop-blur-sm" />
				<div className="w-full flex-1 pt-16 sm:pt-20">{children}</div>
				{/* <Footer /> */}
			</div>
		</ClerkProvider>
	);
}
