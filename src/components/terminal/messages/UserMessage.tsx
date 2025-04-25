import { User } from "lucide-react";
import type { ChatMessage } from "../Codex";

interface UserMessageProps {
	message: ChatMessage;
	dateTime: string;
}

export function UserMessage({ message, dateTime }: UserMessageProps) {
	return (
		<div className="rounded-md border border-border bg-background p-3">
			<div className="mb-2 flex items-center justify-between text-xs">
				<div className="flex items-center gap-1.5">
					<div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
						<User size={12} className="text-primary-foreground" />
					</div>
					<span className="font-medium text-primary">You</span>
				</div>
				<span className="text-muted-foreground">{dateTime}</span>
			</div>
			<div className="font-mono text-foreground text-sm">{message.content}</div>
		</div>
	);
}
