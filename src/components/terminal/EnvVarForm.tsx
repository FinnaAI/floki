"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash } from "lucide-react";
import { useState } from "react";
import { useEnvVars } from "./useEnvVars";
import type { EnvVar } from "./useEnvVars";

interface EnvVarFormProps {
	envVars?: EnvVar[];
	onAddEnvVar?: (key: string, value: string) => void;
	onRemoveEnvVar?: (key: string) => void;
	onClose?: () => void;
}

export function EnvVarForm({
	envVars: propEnvVars,
	onAddEnvVar,
	onRemoveEnvVar,
	onClose,
}: EnvVarFormProps) {
	const [varName, setVarName] = useState("");
	const [varValue, setVarValue] = useState("");

	// Fallback to hook if props not provided
	const {
		envVars: hookEnvVars,
		addEnvVar: hookAddEnvVar,
		removeEnvVar: hookRemoveEnvVar,
	} = useEnvVars();

	const envVars = propEnvVars ?? hookEnvVars;
	const addEnvVar = onAddEnvVar ?? hookAddEnvVar;
	const removeEnvVar = onRemoveEnvVar ?? hookRemoveEnvVar;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (varName && varValue) {
			addEnvVar(varName, varValue);
			setVarName("");
			setVarValue("");
		}
	};

	return (
		<div className="space-y-4 p-4">
			{envVars.length > 0 ? (
				<div className="space-y-2">
					<div className="font-medium text-sm">Defined Variables:</div>
					<div className="space-y-2">
						{envVars.map(({ key, value }) => (
							<div
								key={key}
								className="flex items-center justify-between gap-2"
							>
								<div className="flex-1 truncate">
									<span className="font-mono text-sm">
										{key}={value}
									</span>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => removeEnvVar(key)}
									className="h-8 w-8"
								>
									<Trash className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>
				</div>
			) : (
				<div className="text-muted-foreground text-sm">
					No environment variables defined yet.
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="grid gap-2">
					<Label htmlFor="varName">Variable Name</Label>
					<Input
						id="varName"
						value={varName}
						onChange={(e) => setVarName(e.target.value)}
						placeholder="VARIABLE_NAME"
						className="font-mono"
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="varValue">Variable Value</Label>
					<Input
						id="varValue"
						value={varValue}
						onChange={(e) => setVarValue(e.target.value)}
						placeholder="value"
					/>
				</div>
				<div className="flex justify-between">
					<Button type="submit" disabled={!varName || !varValue}>
						Add Variable
					</Button>
				</div>
			</form>
		</div>
	);
}
