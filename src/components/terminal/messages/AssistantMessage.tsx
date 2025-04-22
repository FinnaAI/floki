import { ChatMessage } from "../Terminal";
import { Bot } from "lucide-react";

interface AssistantMessageProps {
  message: ChatMessage;
  dateTime: string;
}

export function AssistantMessage({ message, dateTime }: AssistantMessageProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-slate-100 dark:border-slate-700 border-l-4 border-l-blue-500">
      <div className="flex justify-between items-center mb-2 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
            <Bot size={12} className="text-white" />
          </div>
          <span className="font-medium text-blue-600 dark:text-blue-400">
            Assistant
          </span>
        </div>
        <span className="text-slate-400">{dateTime}</span>
      </div>
      <div className="font-mono text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
        {message.content}
      </div>
    </div>
  );
}
