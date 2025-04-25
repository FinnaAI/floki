interface CodexReasoningMessageProps {
	data: string;
	dateTime: string;
}

export function CodexReasoningMessage({
	data,
	dateTime,
}: CodexReasoningMessageProps) {
	return (
		<div className="rounded-md border-yellow-500 border-l-4 bg-slate-900 p-3">
			<div className="mb-1 flex items-center justify-between text-xs">
				<span className="font-semibold text-yellow-400 uppercase">
					codex reasoning
				</span>
				<span className="text-gray-400">{dateTime}</span>
			</div>
			<div className="whitespace-pre-wrap rounded border-yellow-500 border-l bg-slate-950 p-2 pl-3 font-mono text-sm text-yellow-100">
				{data.split("\n").map((line) => (
					<div
						key={line.trim()}
						className={line.startsWith("**") ? "font-bold text-yellow-300" : ""}
					>
						{line}
					</div>
				))}
			</div>
		</div>
	);
}
