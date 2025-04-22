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
import { Code, Command, Power, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CommandInput } from "./CommandInput";
import { EnvVarForm } from "./EnvVarForm";
import { MessageList } from "./MessageList";
import { useEnvVars } from "./useEnvVars";
import { useWebSocket } from "./useWebSocket";

export interface ChatMessage {
  type: "user" | "system" | "assistant" | "reasoning";
  content: string | React.ReactNode;
  timestamp: Date;
  id?: string;
}

export function Codex() {
  const [input, setInput] = useState("");
  const [showEnvModal, setShowEnvModal] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [codexMode, setCodexMode] = useState(true);

  // Custom hooks
  const { connected, messages, sendCommand, connectWebSocket, clearMessages } =
    useWebSocket();

  const { envVars, addEnvVar, applyEnvVars } = useEnvVars();

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
  }, []); // No dependencies needed as we're just setting up scroll behavior

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
      if (parts && parts.length >= 2) {
        const key = parts[0]?.trim() || "";
        const value = parts.slice(1).join("=").trim();
        if (key) {
          addEnvVar(key, value);
        }
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
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="relative flex h-full w-full flex-col overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-lg dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
        {/* Header - fixed to top */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-slate-200 border-b bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 shadow-sm">
              <Code size={20} className="text-white" />
            </div>
            <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text font-bold text-transparent text-xl dark:from-blue-400 dark:to-indigo-400">
              Codex
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEnvModal(true)}
              className="rounded-lg border-slate-200 ring-blue-500/40 ring-offset-2 ring-offset-white transition-all hover:bg-slate-100 focus:ring-2 dark:border-slate-700 dark:ring-offset-slate-900 dark:hover:bg-slate-800"
            >
              <Command size={16} className="mr-1.5 text-blue-500" />
              <span>ENV</span>
            </Button>
            <Button
              variant={connected ? "outline" : "default"}
              size="sm"
              onClick={connectWebSocket}
              disabled={connected}
              className={`rounded-lg ring-offset-2 ring-offset-white transition-all focus:ring-2 dark:ring-offset-slate-900 ${
                connected
                  ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              <Power
                size={16}
                className={`mr-1.5 ${
                  connected ? "text-blue-500" : "text-white"
                }`}
              />
              <span>{connected ? "Connected" : "Connect"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearMessages}
              className="rounded-lg border-slate-200 ring-blue-500/40 ring-offset-2 ring-offset-white transition-all hover:bg-slate-100 focus:ring-2 dark:border-slate-700 dark:ring-offset-slate-900 dark:hover:bg-slate-800"
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
        <div className="sticky bottom-0 rounded-b-xl border-slate-200 border-t bg-white p-4 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex gap-2">
            <CommandInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleSendCommand}
              connected={connected}
              placeholder="Enter message for Codex..."
            />
            <Button
              variant="destructive"
              size="icon"
              onClick={() => sendCommand("STOP_COMMAND", true)}
              title="Stop running command (Ctrl+C)"
              className="rounded-lg ring-red-500/40 ring-offset-2 ring-offset-white transition-all hover:bg-red-600 focus:ring-2 dark:ring-offset-slate-900"
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
            <DialogTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text font-bold text-transparent text-xl dark:from-blue-400 dark:to-indigo-400">
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
