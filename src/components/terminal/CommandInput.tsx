"use client";

import { Command } from "lucide-react";
import type { ChangeEvent, KeyboardEvent } from "react";

interface CommandInputProps {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  connected: boolean;
  placeholder?: string;
}

export function CommandInput({
  value,
  onChange,
  onKeyDown,
  connected,
  placeholder = "Enter a command...",
}: CommandInputProps) {
  return (
    <div className="relative flex-1">
      <div className="absolute left-2.5 top-2.5 text-muted-foreground">
        <Command size={16} />
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={!connected}
        placeholder={connected ? placeholder : "Disconnected..."}
        className="flex h-9 w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
