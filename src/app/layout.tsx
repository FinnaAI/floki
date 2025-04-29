import "@/styles/globals.css";

import { FileStoreInitializer } from "@/components/file-store-initializer";
import { env } from "@/env";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";

export const metadata: Metadata = {
	title: "Floki",
	description: "Floki",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${geist.variable}`}>
			<head>
				{env.NODE_ENV === "development" && (
					<script
						crossOrigin="anonymous"
						src="//unpkg.com/react-scan/dist/auto.global.js"
					/>
				)}
			</head>
			<body className="dark">
				<FileStoreInitializer />
				{children}
				<Toaster />
			</body>
		</html>
	);
}
