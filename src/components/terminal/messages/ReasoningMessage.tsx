import type { ChatMessage } from "../Terminal";
import { BrainCircuit } from "lucide-react";

interface ReasoningMessageProps {
  message: ChatMessage;
  dateTime: string;
}

export function ReasoningMessage({ message, dateTime }: ReasoningMessageProps) {
  let content = message.content;
  let durationMs = 0;

  // Extract duration if available in the content
  if (typeof content === "string" && content.includes("duration_ms")) {
    try {
      const data = JSON.parse(content);
      if (data?.duration_ms) {
        durationMs = data.duration_ms;
        content = data.summary || content;
      }
    } catch (e) {
      // Not valid JSON, use content as is
    }
  }

  return (
    <div className="rounded-lg border border-slate-100 border-l-4 border-l-amber-500 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500">
            <BrainCircuit size={12} className="text-white" />
          </div>
          <span className="font-medium text-amber-600 dark:text-amber-400">
            Reasoning
          </span>
          {durationMs > 0 && (
            <span className="text-slate-500 ml-2">
              ({(durationMs / 1000).toFixed(2)}s)
            </span>
          )}
        </div>
        <span className="text-slate-400">{dateTime}</span>
      </div>
      <div className="font-mono text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap border-l-2 border-amber-400/30 pl-3 py-1">
        {typeof content === "string"
          ? content.split("\n").map((line, i) => <div key={i}>{line}</div>)
          : content}
      </div>
    </div>
  );
}
