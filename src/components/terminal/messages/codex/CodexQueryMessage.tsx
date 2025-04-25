interface CodexQueryMessageProps {
	query: string;
	dateTime: string;
}

export function CodexQueryMessage({ query, dateTime }: CodexQueryMessageProps) {
	return (
		<div className="rounded-md border-green-500 border-l-4 bg-slate-800 p-3">
			<div className="mb-1 flex items-center justify-between text-xs">
				<span className="font-semibold text-green-400 uppercase">
					codex query
				</span>
				<span className="text-gray-400">{dateTime}</span>
			</div>
			<div className="whitespace-pre-wrap font-mono text-green-300 text-sm">
				{query}
			</div>
		</div>
	);
}
