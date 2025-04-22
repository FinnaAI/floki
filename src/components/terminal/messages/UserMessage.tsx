import { User } from "lucide-react";
import type { ChatMessage } from "../Codex";

interface UserMessageProps {
  message: ChatMessage;
  dateTime: string;
}

export function UserMessage({ message, dateTime }: UserMessageProps) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
            <User size={12} className="text-white" />
          </div>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            You
          </span>
        </div>
        <span className="text-slate-400">{dateTime}</span>
      </div>
      <div className="font-mono text-slate-700 text-sm dark:text-slate-300">
        {message.content}
      </div>
    </div>
  );
}
