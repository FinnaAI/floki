import React from "react";
import { ChatMessage } from "./Terminal";
import { UserMessage } from "./messages/UserMessage";
import { SystemMessage } from "./messages/SystemMessage";
import { AssistantMessage } from "./messages/AssistantMessage";
import { ReasoningMessage } from "./messages/ReasoningMessage";
import { EnvVar } from "./useEnvVars";
import { Terminal as TerminalIcon } from "lucide-react";

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
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <TerminalIcon size={28} className="text-emerald-500" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-slate-700 dark:text-slate-300 font-medium">
            Welcome to the Terminal
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Type{" "}
            <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-emerald-600 dark:text-emerald-400 font-mono text-xs">
              help
            </code>{" "}
            to see available commands
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 gap-2 flex flex-col">
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
