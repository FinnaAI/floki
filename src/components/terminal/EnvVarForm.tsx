"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EnvVar } from "./useEnvVars";

interface EnvVarFormProps {
  envVars: EnvVar[];
  onAddEnvVar: (key: string, value: string) => void;
  onClose: () => void;
}

export function EnvVarForm({ envVars, onAddEnvVar, onClose }: EnvVarFormProps) {
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");

  const handleAddEnvVar = () => {
    if (newEnvKey.trim() && newEnvValue.trim()) {
      onAddEnvVar(newEnvKey.trim(), newEnvValue.trim());
      setNewEnvKey("");
      setNewEnvValue("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="envKey">Key</Label>
          <Input
            id="envKey"
            value={newEnvKey}
            onChange={(e) => setNewEnvKey(e.target.value)}
            placeholder="OPENAI_API_KEY"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="envValue">Value</Label>
          <Input
            id="envValue"
            value={newEnvValue}
            onChange={(e) => setNewEnvValue(e.target.value)}
            placeholder="sk-..."
          />
        </div>
      </div>

      <Button onClick={handleAddEnvVar} className="w-full">
        Add Variable
      </Button>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
        <h4 className="text-sm font-medium mb-2">Current Variables:</h4>
        {envVars.length === 0 ? (
          <p className="text-sm text-gray-500">No environment variables set</p>
        ) : (
          <div className="bg-slate-950 rounded-md p-2 max-h-48 overflow-y-auto">
            {envVars.map((env, i) => (
              <div
                key={i}
                className="py-1 border-b border-gray-800 last:border-0"
              >
                <span className="font-mono text-yellow-500">{env.key}</span>=
                <span className="font-mono text-green-500">{env.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
