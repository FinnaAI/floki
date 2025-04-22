"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Terminal, Loader2, ArrowRight } from "lucide-react";

interface CommandInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  connected: boolean;
  placeholder?: string;
}

export function CommandInput({
  value,
  onChange,
  onKeyDown,
  connected,
  placeholder,
}: CommandInputProps) {
  return (
    <div className="relative flex-1 group">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
        <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center group-focus-within:bg-emerald-600 transition-all duration-200 shadow-md">
          <span className="text-white font-mono font-bold text-xs">$</span>
        </div>
      </div>
      <Input
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={
          placeholder || (connected ? "Type a command..." : "Connecting...")
        }
        className="pl-12 pr-12 h-11 font-mono w-full rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200"
        disabled={!connected}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck="false"
      />
      {value && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1.5 text-emerald-500 font-medium text-xs bg-emerald-50 dark:bg-emerald-900/20 py-1 px-2 rounded-md">
          <span>Enter</span>
          <ArrowRight size={14} />
        </div>
      )}
      {!connected && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 py-1 px-2 rounded-md">
          <Loader2 size={14} className="text-amber-500 animate-spin" />
          <span className="text-amber-500 text-xs font-medium">
            Connecting...
          </span>
        </div>
      )}
    </div>
  );
}
