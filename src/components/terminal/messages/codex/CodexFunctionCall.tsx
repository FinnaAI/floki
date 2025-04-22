import React from "react";

interface CodexFunctionCallProps {
  data: any;
  dateTime: string;
}

export function CodexFunctionCall({ data, dateTime }: CodexFunctionCallProps) {
  // Parse JSON if it's a string
  const jsonData = typeof data === "string" ? JSON.parse(data) : data;

  const { id, type, status, name, arguments: args } = jsonData;

  // Try to parse the arguments if it's a string
  let parsedArgs = args;
  try {
    if (typeof args === "string") {
      parsedArgs = JSON.parse(args);
    }
  } catch (e) {
    // Use unparsed args if parsing fails
  }

  return (
    <div className="bg-slate-800 rounded-md p-3 border-l-4 border-purple-500">
      <div className="flex justify-between items-center mb-1 text-xs">
        <span className="font-semibold uppercase text-purple-400">
          function call
        </span>
        <span className="text-gray-400">{dateTime}</span>
      </div>
      <div className="font-mono text-sm">
        <div className="flex space-x-2">
          <span className="text-purple-300">ID:</span>
          <span className="text-white">{id}</span>
        </div>
        {name && (
          <div className="flex space-x-2">
            <span className="text-purple-300">Name:</span>
            <span className="text-white">{name}</span>
          </div>
        )}
        <div className="flex space-x-2">
          <span className="text-purple-300">Status:</span>
          <span className="text-white">{status}</span>
        </div>
        {parsedArgs && parsedArgs.command && (
          <div className="mt-1">
            <span className="text-purple-300">Command:</span>
            <div className="bg-slate-900 p-2 rounded mt-1 text-green-300 whitespace-pre-wrap">
              {Array.isArray(parsedArgs.command)
                ? parsedArgs.command.join(" ")
                : parsedArgs.command}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
