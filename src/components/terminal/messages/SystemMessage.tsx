import { ChatMessage } from "../Terminal";
import { EnvVar } from "../useEnvVars";
import React from "react";
import { Server } from "lucide-react";
import {
  CodexFunctionCall,
  CodexFunctionOutput,
  CodexQueryMessage,
  CodexReasoningMessage,
} from "./codex";

interface SystemMessageProps {
  message: ChatMessage;
  dateTime: string;
  envVars: EnvVar[];
}

export function SystemMessage({
  message,
  dateTime,
  envVars,
}: SystemMessageProps) {
  // Handle special commands
  if (
    typeof message.content === "string" &&
    message.content === "env" &&
    envVars.length > 0
  ) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
              <Server size={12} className="text-white" />
            </div>
            <span className="font-medium text-purple-600 dark:text-purple-400">
              System
            </span>
          </div>
          <span className="text-slate-400">{dateTime}</span>
        </div>
        <div className="bg-slate-100 dark:bg-slate-850 rounded-md p-2 max-h-48 overflow-y-auto font-mono text-sm">
          {envVars.map((env, i) => (
            <div
              key={i}
              className="py-1 border-b border-slate-200 dark:border-slate-700 last:border-0"
            >
              <span className="text-amber-600 dark:text-amber-500">
                {env.key}
              </span>
              =
              <span className="text-emerald-600 dark:text-emerald-500">
                {env.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle help command
  if (
    typeof message.content === "string" &&
    message.content.includes("Available Commands:")
  ) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
              <Server size={12} className="text-white" />
            </div>
            <span className="font-medium text-purple-600 dark:text-purple-400">
              System
            </span>
          </div>
          <span className="text-slate-400">{dateTime}</span>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h3 className="text-lg font-medium mt-0">Available Commands:</h3>
          <ul className="mt-2 space-y-1.5">
            <li className="flex items-baseline">
              <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400 font-mono text-xs mr-2">
                env
              </code>
              <span>Show all environment variables</span>
            </li>
            <li className="flex items-baseline">
              <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400 font-mono text-xs mr-2">
                env set KEY=VALUE
              </code>
              <span>Set an environment variable</span>
            </li>
            <li className="flex items-baseline">
              <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400 font-mono text-xs mr-2">
                env add
              </code>
              <span>Open modal to add a variable</span>
            </li>
            <li className="flex items-baseline">
              <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400 font-mono text-xs mr-2">
                help
              </code>
              <span>Show this help message</span>
            </li>
            <li className="flex items-baseline">
              <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400 font-mono text-xs mr-2">
                codex &quot;your prompt&quot;
              </code>
              <span>Run Codex with a prompt</span>
            </li>
            <li className="flex items-baseline">
              <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400 font-mono text-xs mr-2">
                clear
              </code>
              <span>Clear the chat</span>
            </li>
            <li className="flex items-baseline mt-2">
              <em className="text-slate-500 font-medium">Any other command</em>
              <span className="ml-2">Executed as a shell command</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // Handle Codex function call
  if (
    typeof message.content === "string" &&
    message.content.includes('"type":"function_call"')
  ) {
    try {
      return <CodexFunctionCall data={message.content} dateTime={dateTime} />;
    } catch (e) {
      // If parsing fails, render as standard message
    }
  }

  // Handle Codex function output
  if (
    typeof message.content === "string" &&
    message.content.includes('"type":"function_call_output"')
  ) {
    try {
      return <CodexFunctionOutput data={message.content} dateTime={dateTime} />;
    } catch (e) {
      // If parsing fails, render as standard message
    }
  }

  // Handle Codex query
  if (
    typeof message.content === "string" &&
    message.content.startsWith("Codex query: ")
  ) {
    const query = message.content
      .substring("Codex query: ".length)
      .replace(/^"(.+)"$/, "$1");
    return <CodexQueryMessage query={query} dateTime={dateTime} />;
  }

  // Handle Codex reasoning (standard text that's not JSON)
  if (
    typeof message.content === "string" &&
    message.content.includes("**") &&
    !message.content.startsWith("{")
  ) {
    return <CodexReasoningMessage data={message.content} dateTime={dateTime} />;
  }

  // Default system message
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex justify-between items-center mb-2 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
            <Server size={12} className="text-white" />
          </div>
          <span className="font-medium text-purple-600 dark:text-purple-400">
            System
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
