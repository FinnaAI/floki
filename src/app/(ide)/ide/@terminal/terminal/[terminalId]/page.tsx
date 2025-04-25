export default function TerminalPage({
	params,
}: {
	params: { terminalId: string };
}) {
	return (
		<div className="flex h-full flex-col">terminal {params.terminalId}</div>
	);
}
