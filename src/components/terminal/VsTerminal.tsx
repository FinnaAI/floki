"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Square,
  Terminal as TerminalIcon,
  Command,
  Power,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { EnvVarForm } from "./EnvVarForm";
import dynamic from "next/dynamic";

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

export function VsTerminal() {
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

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex flex-col h-full w-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden">
        {/* Header - fixed to top */}
        <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm">
              <TerminalIcon size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 text-transparent bg-clip-text">
              Terminal
            </h1>
          </div>
          <div className="flex space-x-2 items-center">
            {loading && (
              <div className="flex items-center mr-2">
                <RotateCw size={16} className="animate-spin text-slate-500" />
                <span className="ml-2 text-sm text-slate-500">Loading...</span>
              </div>
            )}
            {error && (
              <div className="flex items-center text-red-500 mr-2">
                <AlertCircle size={16} />
                <span className="ml-2 text-sm">{error}</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEnvModal(true)}
              className="rounded-lg border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-emerald-500/40 transition-all"
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
              className={`rounded-lg focus:ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 transition-all ${
                connected
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
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
              className="rounded-lg border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-emerald-500/40 transition-all"
            >
              Clear
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (typeof window !== "undefined") {
                  const event = new CustomEvent("terminal:kill");
                  window.dispatchEvent(event);
                }
              }}
              className="rounded-lg hover:bg-red-600 focus:ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-red-500/40 transition-all"
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
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 text-transparent bg-clip-text">
              Environment Variables
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Define environment variables for your terminal session.
            </p>
          </DialogHeader>
          <EnvVarForm onClose={() => setShowEnvModal(false)} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEnvModal(false)}
              className="rounded-lg border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
