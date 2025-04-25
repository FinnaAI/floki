import { Server } from "lucide-react";
import React from "react";
import type { ChatMessage } from "../Codex";
import type { EnvVar } from "../useEnvVars";
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
      <div className="rounded-md border border-border bg-background p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-500">
              <Server size={12} className="text-primary-foreground" />
            </div>
            <span className="font-medium text-purple-500">System</span>
          </div>
          <span className="text-muted-foreground">{dateTime}</span>
        </div>
        <div className="max-h-48 overflow-y-auto rounded-md bg-muted p-2 font-mono text-sm">
          {envVars.map((env, i) => (
            <div
              key={`env-${env.key}-${i}`}
              className="border-border border-b py-1 last:border-0"
            >
              <span className="text-amber-600">{env.key}</span>=
              <span className="text-primary">{env.value}</span>
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
      <div className="rounded-md border border-border bg-background p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-500">
              <Server size={12} className="text-primary-foreground" />
            </div>
            <span className="font-medium text-purple-500">System</span>
          </div>
          <span className="text-muted-foreground">{dateTime}</span>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h3 className="mt-0 font-medium text-lg">Available Commands:</h3>
          <ul className="mt-2 space-y-1.5">
            <li className="flex items-baseline">
              <code className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-amber-600 text-xs">
                env
              </code>
              <span>Show all environment variables</span>
            </li>
            <li className="flex items-baseline">
              <code className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-amber-600 text-xs">
                env set KEY=VALUE
              </code>
              <span>Set an environment variable</span>
            </li>
            <li className="flex items-baseline">
              <code className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-amber-600 text-xs">
                env add
              </code>
              <span>Open modal to add a variable</span>
            </li>
            <li className="flex items-baseline">
              <code className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-amber-600 text-xs">
                help
              </code>
              <span>Show this help message</span>
            </li>
            <li className="flex items-baseline">
              <code className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-amber-600 text-xs">
                codex &quot;your prompt&quot;
              </code>
              <span>Run Codex with a prompt</span>
            </li>
            <li className="flex items-baseline">
              <code className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-amber-600 text-xs">
                clear
              </code>
              <span>Clear the chat</span>
            </li>
            <li className="mt-2 flex items-baseline">
              <em className="font-medium text-muted-foreground">
                Any other command
              </em>
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
    <div className="rounded-md border border-border bg-background p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-500">
            <Server size={12} className="text-primary-foreground" />
          </div>
          <span className="font-medium text-purple-500">System</span>
        </div>
        <span className="text-muted-foreground">{dateTime}</span>
      </div>
      <div className="whitespace-pre-wrap font-mono text-sm text-foreground">
        {message.content}
      </div>
    </div>
  );
}
