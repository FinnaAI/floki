import React from "react";

interface CodexReasoningMessageProps {
  data: string;
  dateTime: string;
}

export function CodexReasoningMessage({
  data,
  dateTime,
}: CodexReasoningMessageProps) {
  return (
    <div className="bg-slate-900 rounded-md p-3 border-l-4 border-yellow-500">
      <div className="flex justify-between items-center mb-1 text-xs">
        <span className="font-semibold uppercase text-yellow-400">
          codex reasoning
        </span>
        <span className="text-gray-400">{dateTime}</span>
      </div>
      <div className="font-mono text-sm text-yellow-100 whitespace-pre-wrap border-l border-yellow-500 pl-3 bg-slate-950 p-2 rounded">
        {data.split("\n").map((line, i) => (
          <div
            key={i}
            className={line.startsWith("**") ? "font-bold text-yellow-300" : ""}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
