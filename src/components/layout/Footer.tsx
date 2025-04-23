import Link from "next/link";
import * as motion from "motion/react-client";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t py-4">
      {/* Background pattern */}
      <div className="bg-grid-pattern absolute inset-0 opacity-[0.02] justify-between" />

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="flex justify-between">
          <p className="text-muted-foreground mb-4 text-sm md:mb-0">Floki AI</p>
          <p className="text-muted-foreground mb-4 text-sm md:mb-0">
            AI-First Development Environment
          </p>
        </div>
      </div>
    </footer>
  );
}
