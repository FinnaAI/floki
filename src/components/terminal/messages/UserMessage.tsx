import { ChatMessage } from "../Terminal";
import { User } from "lucide-react";

interface UserMessageProps {
  message: ChatMessage;
  dateTime: string;
}

export function UserMessage({ message, dateTime }: UserMessageProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex justify-between items-center mb-2 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
            <User size={12} className="text-white" />
          </div>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            You
          </span>
        </div>
        <span className="text-slate-400">{dateTime}</span>
      </div>
      <div className="font-mono text-sm text-slate-700 dark:text-slate-300">
        {message.content}
      </div>
    </div>
  );
}
