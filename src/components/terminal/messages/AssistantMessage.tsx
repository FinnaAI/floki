import { Bot } from "lucide-react";
import type { ChatMessage } from "../Codex";

interface AssistantMessageProps {
  message: ChatMessage;
  dateTime: string;
}

export function AssistantMessage({ message, dateTime }: AssistantMessageProps) {
  return (
    <div className="rounded-lg border border-slate-100 border-l-4 border-l-blue-500 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
            <Bot size={12} className="text-white" />
          </div>
          <span className="font-medium text-blue-600 dark:text-blue-400">
            Assistant
          </span>
        </div>
        <span className="text-slate-400">{dateTime}</span>
      </div>
      <div className="whitespace-pre-wrap font-mono text-slate-700 text-sm dark:text-slate-300">
        {message.content}
      </div>
    </div>
  );
}
