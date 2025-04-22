"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  Command,
  Power,
  RotateCw,
  Square,
  Terminal as TerminalIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { EnvVarForm } from "./EnvVarForm";
import { cn } from "@/lib/utils";

// Dynamically import the terminal component with SSR disabled
// const DynamicTerminal = dynamic(
//   () =>
//     import("../terminal/TerminalComponent").then(
//       (mod) => mod.TerminalComponent
//     ),
//   {
//     ssr: false,
//     loading: () => (
//       <div className="flex items-center justify-center h-full w-full bg-[#1e1e1e] text-white p-4">
//         <RotateCw className="mr-2 h-4 w-4 animate-spin" />
//         <span>Loading terminal...</span>
//       </div>
//     ),
//   }
// );

const DynamicTerminal = dynamic(
  async () => (await import("./TerminalComponent")).TerminalComponent,
  { ssr: false }
);

// Define the Terminal component interface
interface TerminalComponentProps {
  onConnected: (isConnected: boolean) => void;
  onLoading: (isLoading: boolean) => void;
  onError: (errorMsg: string | null) => void;
  onShellChange: (shellName: string) => void;
}

export function VsTerminal({ autoConnect = false }: { autoConnect?: boolean }) {
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [shell, setShell] = useState("");

  // Memoized callbacks to prevent prop identity changes that cause repeated effect runs in TerminalComponent
  const handleConnected = useCallback(
    (isConnected: boolean) => setConnected(isConnected),
    []
  );
  const handleLoading = useCallback(
    (isLoading: boolean) => setLoading(isLoading),
    []
  );
  const handleError = useCallback(
    (errorMsg: string | null) => setError(errorMsg),
    []
  );
  const handleShellChange = useCallback(
    (shellName: string) => setShell(shellName),
    []
  );

  useEffect(() => {
    if (autoConnect) {
      if (typeof window !== "undefined") {
        const event = new CustomEvent("terminal:connect");
        window.dispatchEvent(event);
      }
    }
  }, [autoConnect]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="relative flex h-full w-full flex-col overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-lg dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
        {/* Header - fixed to top */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-slate-200 border-b bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-sm">
              <TerminalIcon size={20} className="text-white" />
            </div>
            <h1 className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text font-bold text-transparent text-xl dark:from-emerald-400 dark:to-teal-400">
              Terminal
            </h1>
          </div> */}
          <div className="flex items-center space-x-2">
            {loading && (
              <div className="mr-2 flex items-center">
                <RotateCw size={16} className="animate-spin text-slate-500" />
                <span className="ml-2 text-slate-500 text-sm">Loading...</span>
              </div>
            )}
            {error && (
              <div className="mr-2 flex items-center text-red-500">
                <AlertCircle size={16} />
                <span className="ml-2 text-sm">{error}</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEnvModal(true)}
              className="rounded-lg border-slate-200 ring-emerald-500/40 ring-offset-2 ring-offset-white transition-all hover:bg-slate-100 focus:ring-2 dark:border-slate-700 dark:ring-offset-slate-900 dark:hover:bg-slate-800"
            >
              <Command size={16} className="mr-1.5 text-emerald-500" />
              <span>ENV</span>
            </Button>
            <Button
              variant={connected ? "outline" : "default"}
              size="sm"
              onClick={() => {
                if (typeof window !== "undefined") {
                  const event = new CustomEvent("terminal:connect");
                  window.dispatchEvent(event);
                }
              }}
              disabled={connected}
              className={`rounded-lg ring-offset-2 ring-offset-white transition-all focus:ring-2 dark:ring-offset-slate-900 ${
                connected
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "bg-emerald-500 text-white hover:bg-emerald-600"
              }`}
            >
              <Power
                size={16}
                className={`mr-1.5 ${
                  connected ? "text-emerald-500" : "text-white"
                }`}
              />
              <span>{connected ? "Connected" : "Connect"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (typeof window !== "undefined") {
                  const event = new CustomEvent("terminal:clear");
                  window.dispatchEvent(event);
                }
              }}
              className="rounded-lg border-slate-200 ring-emerald-500/40 ring-offset-2 ring-offset-white transition-all hover:bg-slate-100 focus:ring-2 dark:border-slate-700 dark:ring-offset-slate-900 dark:hover:bg-slate-800"
            >
              Clear
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!connected}
              onClick={() => {
                if (typeof window !== "undefined") {
                  const event = new CustomEvent("terminal:kill");
                  window.dispatchEvent(event);
                }
              }}
              className={cn(
                "rounded-lg border-slate-200 bg-red-200 ring-red-500/40 ring-offset-2 ring-offset-white transition-all hover:bg-red-600 focus:ring-2 dark:border-slate-700 dark:ring-offset-slate-900 dark:hover:bg-slate-800",
                connected && "bg-red-500 text-white hover:bg-red-600"
              )}
            >
              <Square size={16} className="mr-1.5" />
              <span>Kill</span>
            </Button>
          </div>
        </div>

        {/* Terminal Content Area */}
        <div className="flex-1 overflow-hidden bg-[#1e1e1e] p-1">
          <DynamicTerminal
            onConnected={handleConnected}
            onLoading={handleLoading}
            onError={handleError}
            onShellChange={handleShellChange}
          />
        </div>
      </div>

      {/* Environment Variables Modal */}
      <Dialog open={showEnvModal} onOpenChange={setShowEnvModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text font-bold text-transparent text-xl dark:from-emerald-400 dark:to-teal-400">
              Environment Variables
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Define environment variables for your terminal session.
            </p>
          </DialogHeader>
          <EnvVarForm onClose={() => setShowEnvModal(false)} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEnvModal(false)}
              className="rounded-lg border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
