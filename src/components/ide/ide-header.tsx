"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useIdeLayout } from "@/components/ide/ide-context";
import {
  PanelLeft,
  PanelRight,
  FileText,
  Terminal as TerminalIcon,
  Code,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "../ui/sidebar";
import Link from "next/link";

interface IdeHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

export function IdeHeader({ children, className }: IdeHeaderProps) {
  const {
    showFileTree,
    showFileContent,
    showTerminal,
    toggleFileTree,
    toggleFileContent,
    toggleTerminal,
    showCodex,
    toggleCodex,
  } = useIdeLayout();

  return (
    <header
      className={cn(
        "flex items-start justify-between border-slate-200 border-b bg-slate-50 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/50",
        className
      )}
    >
      <div className="flex items-center gap-2 ml-10">
        {/* <SidebarTrigger /> */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="rounded-lg border-slate-200 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <Link href="/">
            <Home
              size={16}
              className="mr-1.5 text-slate-600 dark:text-slate-400"
            />
            Home
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant={showFileTree ? "outline" : "ghost"}
          size="sm"
          className="rounded-lg"
          onClick={toggleFileTree}
        >
          <PanelLeft size={16} className="mr-1" />
          File tree
        </Button>
        <Button
          variant={showFileContent ? "outline" : "ghost"}
          size="sm"
          className={cn("rounded-lg", showFileContent && "")}
          onClick={toggleFileContent}
        >
          <FileText size={16} className="mr-1" />
          Content
        </Button>
        <Button
          variant={showTerminal ? "outline" : "ghost"}
          size="sm"
          className="rounded-lg"
          onClick={toggleTerminal}
        >
          <TerminalIcon size={16} className="mr-1" />
          Terminal
        </Button>
        <Button
          variant={showCodex ? "outline" : "ghost"}
          size="sm"
          className="rounded-lg"
          onClick={toggleCodex}
        >
          <Code size={16} className="mr-1" />
          Codex
        </Button>
      </div>
    </header>
  );
}
