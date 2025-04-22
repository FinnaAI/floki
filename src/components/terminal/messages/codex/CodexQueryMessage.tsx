import React from "react";

interface CodexQueryMessageProps {
  query: string;
  dateTime: string;
}

export function CodexQueryMessage({ query, dateTime }: CodexQueryMessageProps) {
  return (
    <div className="bg-slate-800 rounded-md p-3 border-l-4 border-green-500">
      <div className="flex justify-between items-center mb-1 text-xs">
        <span className="font-semibold uppercase text-green-400">
          codex query
        </span>
        <span className="text-gray-400">{dateTime}</span>
      </div>
      <div className="font-mono text-sm text-green-300 whitespace-pre-wrap">
        {query}
      </div>
    </div>
  );
}
