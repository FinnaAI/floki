import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useState } from "react";

interface CustomDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSendMessage: (message: string) => void;
}

export const CustomDialog = ({
	isOpen,
	onClose,
	onSendMessage,
}: CustomDialogProps) => {
	const [message, setMessage] = useState("");

	const handleSendMessage = () => {
		if (message.trim()) {
			onSendMessage(message);
			setMessage("");
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Ask AI</DialogTitle>
				</DialogHeader>
				<div className="flex h-[400px] flex-col">
					<div className="mb-4 flex-1 overflow-y-auto rounded-md bg-muted p-3">
						{/* Message history would go here */}
						<div className="text-muted-foreground text-sm">
							Ask a question about your code...
						</div>
					</div>

					<div className="flex gap-2">
						<Textarea
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Type your message..."
							className="resize-none"
							rows={3}
						/>
						<Button onClick={handleSendMessage} size="icon" className="h-auto">
							<Send size={16} />
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
