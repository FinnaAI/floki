import { Bot } from "lucide-react";
import type { ChatMessage } from "../Codex";

interface AssistantMessageProps {
  message: ChatMessage;
  dateTime: string;
}

export function AssistantMessage({ message, dateTime }: AssistantMessageProps) {
  return (
    <div className="rounded-md border border-border border-l-4 border-l-blue-500 bg-background p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
            <Bot size={12} className="text-primary-foreground" />
          </div>
          <span className="font-medium text-blue-500">Assistant</span>
        </div>
        <span className="text-muted-foreground">{dateTime}</span>
      </div>
      <div className="whitespace-pre-wrap font-mono text-sm text-foreground">
        {message.content}
      </div>
    </div>
  );
}
