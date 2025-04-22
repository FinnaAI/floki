"use client";

import { useState, useEffect, useRef } from "react";
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
  Code,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

import { EnvVarForm } from "./EnvVarForm";
import { MessageList } from "./MessageList";
import { CommandInput } from "./CommandInput";
import { useWebSocket } from "./useWebSocket";
import { useEnvVars } from "./useEnvVars";

export interface ChatMessage {
  type: "user" | "system" | "assistant" | "reasoning";
  content: string | React.ReactNode;
  timestamp: Date;
  id?: string;
}

export function Terminal() {
  const [input, setInput] = useState("");
  const [showEnvModal, setShowEnvModal] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isRawModeSupported, setIsRawModeSupported] = useState(true);
  const [codexMode, setCodexMode] = useState(false);

  // Custom hooks
  const { connected, messages, sendCommand, connectWebSocket, clearMessages } =
    useWebSocket();

  const { envVars, addEnvVar, applyEnvVars } = useEnvVars();

  // Check if raw mode is supported
  useEffect(() => {
    // In browser environments, we can't use raw mode
    // This is expected, and we'll provide a fallback
    setIsRawModeSupported(true); // Override to true for browser usage
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Handle sending command
  const handleSendCommand = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      const command = input.trim();
      processCommand(command);
      setInput("");
    }
  };

  // Process special commands
  const processCommand = (command: string) => {
    // First, add the user message
    sendCommand(command, true);

    // Handle built-in commands
    if (command === "env" || command === "env show") {
      // Display environment variables handled by MessageList
      return;
    }

    if (command === "env add" || command === "env edit") {
      setShowEnvModal(true);
      return;
    }

    if (command.startsWith("env set ")) {
      const parts = command.substring(8).trim().split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join("=").trim();
        addEnvVar(key, value);
      }
      return;
    }

    if (command === "help") {
      // Help message handled by SystemMessage component
      sendCommand("help", true);
      return;
    }

    if (command === "clear") {
      clearMessages();
      return;
    }

    // Apply environment variables to the command
    let processedCommand = applyEnvVars(command);

    // Add codex prefix if codex mode is enabled
    if (codexMode && !processedCommand.startsWith("codex")) {
      processedCommand = `codex -q "${processedCommand}"`;
    }

    // Send command to WebSocket
    sendCommand(processedCommand);
  };

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
            <div className="flex items-center space-x-2 mr-2">
              <Code
                size={16}
                className={`${
                  codexMode ? "text-emerald-500" : "text-slate-400"
                }`}
              />
              <Switch
                checked={codexMode}
                onCheckedChange={setCodexMode}
                id="codex-mode"
              />
              <label htmlFor="codex-mode" className="text-sm font-medium">
                Codex
              </label>
            </div>
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
              onClick={connectWebSocket}
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
              onClick={clearMessages}
              className="rounded-lg border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-emerald-500/40 transition-all"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Content - scrollable area that fills available space */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full overflow-hidden" ref={scrollAreaRef}>
            <div className="p-4">
              <MessageList messages={messages} envVars={envVars} />
            </div>
          </ScrollArea>
        </div>

        {/* Input area - fixed to bottom */}
        <div className="sticky bottom-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] rounded-b-xl">
          <div className="flex gap-2">
            <CommandInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleSendCommand}
              connected={connected}
              placeholder={codexMode ? "Enter message for Codex..." : undefined}
            />
            <Button
              variant="destructive"
              size="icon"
              onClick={() => sendCommand("STOP_COMMAND", true)}
              title="Stop running command (Ctrl+C)"
              className="rounded-lg hover:bg-red-600 focus:ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-red-500/40 transition-all"
            >
              <Square size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Environment Variables Modal */}
      <Dialog open={showEnvModal} onOpenChange={setShowEnvModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 text-transparent bg-clip-text">
              Environment Variables
            </DialogTitle>
          </DialogHeader>
          <EnvVarForm
            envVars={envVars}
            onAddEnvVar={addEnvVar}
            onClose={() => setShowEnvModal(false)}
          />
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
