interface CodexFunctionCallProps {
	data: {
		id: string;
		type: string;
		status: string;
		name: string;
		arguments: string;
	};
	dateTime: string;
}

export function CodexFunctionCall({ data, dateTime }: CodexFunctionCallProps) {
	// Parse JSON if it's a string
	const jsonData = typeof data === "string" ? JSON.parse(data) : data;

	const { id, type, status, name, arguments: args } = jsonData;

	// Try to parse the arguments if it's a string
	let parsedArgs = args;
	try {
		if (typeof args === "string") {
			parsedArgs = JSON.parse(args);
		}
	} catch (e) {
		// Use unparsed args if parsing fails
	}

	return (
		<div className="rounded-md border-purple-500 border-l-4 p-3">
			<div className="mb-1 flex items-center justify-between text-xs">
				<span className="font-semibold text-purple-400 uppercase">
					function call
				</span>
				<span className="text-gray-400">{dateTime}</span>
			</div>
			<div className="font-mono text-sm">
				<div className="flex space-x-2">
					<span className="text-purple-300">ID:</span>
					<span className="text-white">{id}</span>
				</div>
				{name && (
					<div className="flex space-x-2">
						<span className="text-purple-300">Name:</span>
						<span className="text-white">{name}</span>
					</div>
				)}
				<div className="flex space-x-2">
					<span className="text-purple-300">Status:</span>
					<span className="text-white">{status}</span>
				</div>
				{parsedArgs?.command && (
					<div className="mt-1">
						<span className="text-purple-300">Command:</span>
						<div className="mt-1 whitespace-pre-wrap rounded bg-slate-900 p-2 text-green-300">
							{Array.isArray(parsedArgs.command)
								? parsedArgs.command.join(" ")
								: parsedArgs.command}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
