export default function TerminalPage({
  params,
}: {
  params: { terminalId: string };
}) {
  return (
    <div className="flex flex-col h-full">terminal {params.terminalId}</div>
  );
}
