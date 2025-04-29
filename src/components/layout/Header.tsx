"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SocialIcon } from "react-social-icons";
import { Button } from "../ui/button";
const navItems = [
	// { name: "Go to app", href: "/ide" },
	// { name: "Recipes", href: "/recipes" },
	// { name: "Docs", href: "/docs" },
];

export default function Header({ className }: { className?: string }) {
	const pathname = usePathname();

	const isActive = (href: string) => {
		if (href.startsWith("/#")) return pathname === "/";
		return pathname.startsWith(href);
	};

	return (
		<motion.div
			className={cn(
				`fixed top-0 right-0 left-0 z-50 border-border/40 border-b px-4 py-4 backdrop-blur-md ${className}`,
			)}
			initial={{ y: -100, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.5, ease: "easeOut" }}
		>
			<div className="container mx-auto flex max-w-6xl items-center justify-between">
				<motion.div
					className="flex items-center"
					whileHover={{ scale: 1.05 }}
					transition={{ type: "spring", stiffness: 400, damping: 10 }}
				>
					<Link href="/" className="flex items-center gap-2">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-800">
							<Image src="/fehu-white.svg" alt="logo" width={20} height={20} />
						</div>
						<span className="font-bold text-xl">Floki</span>
					</Link>
				</motion.div>

				<nav className="hidden items-center gap-8 md:flex">
					{navItems.map((item, i) => (
						<motion.div
							key={item.name}
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1 * i, duration: 0.5 }}
						>
							<Link
								href={item.href}
								className={`relative transition-colors ${
									isActive(item.href)
										? "font-medium text-foreground"
										: "text-foreground/80 hover:text-foreground"
								}`}
							>
								{item.name}
								{isActive(item.href) && (
									<motion.div
										className="-bottom-1.5 absolute right-0 left-0 h-0.5 rounded-full bg-primary"
										layoutId="activeNav"
										transition={{ type: "spring", stiffness: 400, damping: 30 }}
									/>
								)}
							</Link>
						</motion.div>
					))}
					<Button variant="" asChild>
						<Link
							href="https://x.com/flokiii_ide"
							target="_blank"
							rel="noopener noreferrer"
						>
							Follow on{" "}
							<SocialIcon
								className="h-4 w-4"
								network="x"
								style={{ height: 25, width: 25 }}
							/>
						</Link>
					</Button>
				</nav>

				{/* <div className="flex items-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <SignedIn>
              <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <Link href="/app">Go to app</Link>
                </Button>
                <UserButton />
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton />
            </SignedOut>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <SignedOut>
              <SignUpButton
                mode="modal"
                appearance={{
                  elements: {
                    formButtonPrimary:
                      "bg-primary text-primary-foreground rounded-lg px-4 py-2 font-medium transition-opacity hover:opacity-90",
                  },
                }}
              />
            </SignedOut>
          </motion.div>
        </div> */}
			</div>
		</motion.div>
	);
}
