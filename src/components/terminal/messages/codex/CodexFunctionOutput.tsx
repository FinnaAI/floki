import React from "react";

interface CodexFunctionOutputProps {
  data: any;
  dateTime: string;
}

export function CodexFunctionOutput({
  data,
  dateTime,
}: CodexFunctionOutputProps) {
  // Parse JSON if it's a string
  const jsonData = typeof data === "string" ? JSON.parse(data) : data;

  // Extract data from the JSON
  const { call_id, output } = jsonData;

  // Try to parse the output if it's a string
  let parsedOutput = output;
  try {
    if (typeof output === "string") {
      parsedOutput = JSON.parse(output);
    }
  } catch (e) {
    // Use unparsed output if parsing fails
  }

  // Extract metadata if available
  const metadata = parsedOutput?.metadata || {};

  // Format output to handle deep nesting
  const formatOutput = (output: any) => {
    if (typeof output === "string") {
      return output;
    }

    if (output?.output) {
      return output.output;
    }

    return JSON.stringify(output, null, 2);
  };

  return (
    <div className="bg-slate-800 rounded-md p-3 border-l-4 border-indigo-500">
      <div className="flex justify-between items-center mb-1 text-xs">
        <span className="font-semibold uppercase text-indigo-400">
          function output
        </span>
        <span className="text-gray-400">{dateTime}</span>
      </div>
      <div className="font-mono text-sm">
        <div className="flex space-x-2">
          <span className="text-indigo-300">Call ID:</span>
          <span className="text-white">{call_id}</span>
        </div>

        {metadata?.exit_code !== undefined && (
          <div className="flex space-x-2">
            <span className="text-indigo-300">Exit code:</span>
            <span
              className={
                metadata.exit_code === 0 ? "text-green-400" : "text-red-400"
              }
            >
              {metadata.exit_code}
            </span>
          </div>
        )}

        {metadata?.duration_seconds !== undefined && (
          <div className="flex space-x-2">
            <span className="text-indigo-300">Duration:</span>
            <span className="text-white">{metadata.duration_seconds}s</span>
          </div>
        )}

        {parsedOutput && (
          <div className="mt-2">
            <span className="text-indigo-300">Output:</span>
            <div className="bg-slate-900 p-2 rounded mt-1 text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-80 overflow-y-auto">
              {formatOutput(parsedOutput)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
