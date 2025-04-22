import { Terminal as TerminalIcon } from "lucide-react";
import React from "react";
import type { ChatMessage } from "./Codex";
import { AssistantMessage } from "./messages/AssistantMessage";
import { ReasoningMessage } from "./messages/ReasoningMessage";
import { SystemMessage } from "./messages/SystemMessage";
import { UserMessage } from "./messages/UserMessage";
import type { EnvVar } from "./useEnvVars";

interface MessageListProps {
  messages: ChatMessage[];
  envVars: EnvVar[];
}

export function MessageList({ messages, envVars }: MessageListProps) {
  // Filter out duplicate reasoning messages by tracking IDs
  const renderedIds = new Set<string>();
  const filteredMessages = messages.filter((message) => {
    // Only filter reasoning and assistant messages with IDs
    if (
      (message.type === "reasoning" || message.type === "assistant") &&
      message.id
    ) {
      if (renderedIds.has(message.id)) {
        return false; // Skip this message, already seen this ID
      }
      renderedIds.add(message.id);
    }
    return true;
  });

  if (filteredMessages.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <TerminalIcon size={28} className="text-emerald-500" />
        </div>
        <div className="space-y-1 text-center">
          <p className="font-medium text-slate-700 dark:text-slate-300">
            Welcome to the Terminal
          </p>
          <p className="text-slate-500 text-sm dark:text-slate-400">
            Type{" "}
            <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-emerald-600 text-xs dark:bg-slate-700 dark:text-emerald-400">
              help
            </code>{" "}
            to see available commands
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 space-y-3">
      {filteredMessages.map((message, index) => {
        const dateTime = message.timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        switch (message.type) {
          case "user":
            return (
              <UserMessage key={index} message={message} dateTime={dateTime} />
            );

          case "system":
            return (
              <SystemMessage
                key={index}
                message={message}
                dateTime={dateTime}
                envVars={envVars}
              />
            );

          case "assistant":
            return (
              <AssistantMessage
                key={index}
                message={message}
                dateTime={dateTime}
              />
            );

          case "reasoning":
            return (
              <ReasoningMessage
                key={index}
                message={message}
                dateTime={dateTime}
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
