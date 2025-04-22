"use client";

import React, { useEffect, useRef } from "react";
import { VsTerminal } from "@/components/terminal/VsTerminal";

interface TerminalPanelProps {
  className?: string;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({ className }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Auto-connect when terminal is first rendered
  useEffect(() => {
    if (!hasInitialized.current && terminalRef.current) {
      hasInitialized.current = true;
      // The VsTerminal should have an auto-connect behavior
      // If it doesn't, implement additional connection logic here
    }
  }, []);

  return (
    <div className={`flex h-full flex-col ${className || ""}`}>
      <div className="flex h-8 items-center justify-between border-slate-200 border-b bg-slate-100 px-4 text-slate-500 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
        <div>Terminal</div>
      </div>
      <div className="flex-1 overflow-hidden" ref={terminalRef}>
        <VsTerminal autoConnect={true} />
      </div>
    </div>
  );
};
