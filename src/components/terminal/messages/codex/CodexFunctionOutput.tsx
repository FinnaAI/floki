interface CodexFunctionOutputProps {
	data: {
		call_id: string;
		output: string;
		metadata: {
			exit_code?: number;
			duration_seconds?: number;
		};
	};
	dateTime: string;
}
export function CodexFunctionOutput({
	data,
	dateTime,
}: CodexFunctionOutputProps) {
	// Parse JSON if it's a string
	const jsonData = typeof data === "string" ? JSON.parse(data) : data;

	// Extract data from the JSON
	const { call_id, output } = jsonData;

	// Try to parse the output if it's a string
	let parsedOutput = output;
	try {
		if (typeof output === "string") {
			parsedOutput = JSON.parse(output);
		}
	} catch (e) {
		// Use unparsed output if parsing fails
	}

	// Extract metadata if available
	const metadata = parsedOutput?.metadata || {};

	// Format output to handle deep nesting
	const formatOutput = (output: { output: string }) => {
		if (typeof output === "string") {
			return output;
		}

		if (output?.output) {
			return output.output;
		}

		return JSON.stringify(output, null, 2);
	};

	return (
		<div className="rounded-md border-indigo-500 border-l-4 bg-slate-800 p-3">
			<div className="mb-1 flex items-center justify-between text-xs">
				<span className="font-semibold text-indigo-400 uppercase">
					function output
				</span>
				<span className="text-gray-400">{dateTime}</span>
			</div>
			<div className="font-mono text-sm">
				<div className="flex space-x-2">
					<span className="text-indigo-300">Call ID:</span>
					<span className="text-white">{call_id}</span>
				</div>

				{metadata?.exit_code !== undefined && (
					<div className="flex space-x-2">
						<span className="text-indigo-300">Exit code:</span>
						<span
							className={
								metadata.exit_code === 0 ? "text-green-400" : "text-red-400"
							}
						>
							{metadata.exit_code}
						</span>
					</div>
				)}

				{metadata?.duration_seconds !== undefined && (
					<div className="flex space-x-2">
						<span className="text-indigo-300">Duration:</span>
						<span className="text-white">{metadata.duration_seconds}s</span>
					</div>
				)}

				{parsedOutput && (
					<div className="mt-2">
						<span className="text-indigo-300">Output:</span>
						<div className="mt-1 max-h-80 overflow-x-auto overflow-y-auto whitespace-pre-wrap rounded bg-slate-900 p-2 text-gray-300">
							{formatOutput(parsedOutput)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
