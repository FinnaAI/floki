"use client";

import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ChevronDown, Command } from "lucide-react";
import { useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Input } from "../ui/input";

// Available models and providers based on Codex documentation
const MODELS = [
	{ value: "o4-mini", label: "o4-mini (default)" },
	{ value: "o4", label: "o4" },
	{ value: "o3", label: "o3" },
	{ value: "gpt-4.1", label: "GPT-4.1" },
	{ value: "gpt-4o", label: "GPT-4o" },
	{ value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
];

const PROVIDERS = [
	{ value: "openai", label: "OpenAI (default)" },
	{ value: "openrouter", label: "OpenRouter" },
	{ value: "gemini", label: "Gemini" },
	{ value: "ollama", label: "Ollama" },
	{ value: "mistral", label: "Mistral" },
	{ value: "deepseek", label: "DeepSeek" },
	{ value: "xai", label: "xAI" },
	{ value: "groq", label: "Groq" },
];

interface CommandInputProps {
	value: string;
	onChange: (event: ChangeEvent<HTMLInputElement>) => void;
	onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
	connected: boolean;
	placeholder?: string;
	onModelChange?: (model: string) => void;
	onProviderChange?: (provider: string) => void;
}

export function CommandInput({
	value,
	onChange,
	onKeyDown,
	connected,
	placeholder = "Enter a command...",
	onModelChange,
	onProviderChange,
}: CommandInputProps) {
	const [model, setModel] = useState<string>("o4-mini");
	const [provider, setProvider] = useState<string>("openai");
	const [showSettings, setShowSettings] = useState(false);

	const handleModelChange = (newModel: string) => {
		setModel(newModel);
		onModelChange?.(newModel);
	};

	const handleProviderChange = (newProvider: string) => {
		setProvider(newProvider);
		onProviderChange?.(newProvider);
	};

	return (
		<div className="relative flex flex-1 gap-1">
			<div className="relative flex-1">
				<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
					<Command size={16} className="text-muted-foreground" />
				</div>
				<Input
					type="text"
					value={value}
					onChange={onChange}
					onKeyDown={onKeyDown}
					disabled={!connected}
					placeholder={connected ? placeholder : "Disconnected..."}
					className="w-full pl-9"
				/>
			</div>
			<Popover open={showSettings} onOpenChange={setShowSettings}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						size="icon"
						className="h-full"
						title="Model settings"
					>
						<ChevronDown size={14} />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-64">
					<div className="grid gap-4">
						<div className="grid gap-2">
							<div className="font-medium text-sm">Model</div>
							<Select value={model} onValueChange={handleModelChange}>
								<SelectTrigger>
									<SelectValue placeholder="Select model" />
								</SelectTrigger>
								<SelectContent>
									{MODELS.map((model) => (
										<SelectItem key={model.value} value={model.value}>
											{model.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="grid gap-2">
							<div className="font-medium text-sm">Provider</div>
							<Select value={provider} onValueChange={handleProviderChange}>
								<SelectTrigger>
									<SelectValue placeholder="Select provider" />
								</SelectTrigger>
								<SelectContent>
									{PROVIDERS.map((provider) => (
										<SelectItem key={provider.value} value={provider.value}>
											{provider.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
