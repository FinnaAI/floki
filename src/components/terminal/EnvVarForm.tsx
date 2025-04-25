"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import type { EnvVar } from "./useEnvVars";

interface EnvVarFormProps {
	envVars: EnvVar[];
	onAddEnvVar: (key: string, value: string) => void;
	onClose: () => void;
}

export function EnvVarForm({ envVars, onAddEnvVar, onClose }: EnvVarFormProps) {
	const [key, setKey] = useState("");
	const [value, setValue] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (key.trim() && value.trim()) {
			onAddEnvVar(key.trim(), value.trim());
			setKey("");
			setValue("");
		}
	};

	return (
		<div>
			<div className="mb-4">
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="grid grid-cols-[1fr_auto_2fr] items-center gap-2">
						<Input
							placeholder="KEY"
							value={key}
							onChange={(e) => setKey(e.target.value)}
							className="h-9"
						/>
						<span className="text-center text-muted-foreground">=</span>
						<Input
							placeholder="VALUE"
							value={value}
							onChange={(e) => setValue(e.target.value)}
							className="h-9"
						/>
					</div>
					<Button
						type="submit"
						disabled={!key.trim() || !value.trim()}
						className="w-full"
					>
						<PlusCircle className="mr-2 h-4 w-4" />
						Add Environment Variable
					</Button>
				</form>
			</div>

			{envVars.length > 0 && (
				<div className="mt-4">
					<h3 className="mb-2 font-medium text-sm">
						Current Environment Variables
					</h3>
					<div className="overflow-hidden rounded-md border border-border">
						<table className="min-w-full divide-y divide-border">
							<thead className="bg-muted">
								<tr>
									<th
										scope="col"
										className="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase"
									>
										Key
									</th>
									<th
										scope="col"
										className="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase"
									>
										Value
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{envVars.map((env, index) => (
									<tr key={`${env.key}-${index}`}>
										<td className="whitespace-nowrap px-4 py-2 font-medium text-sm">
											{env.key}
										</td>
										<td className="px-4 py-2 text-muted-foreground text-sm">
											{env.value}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
