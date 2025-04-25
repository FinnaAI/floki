export default async function EditorPage({
	params,
}: {
	params: { filePath: string };
}) {
	const filePath = params.filePath;

	return <div className="flex h-full flex-col">editor {filePath}</div>;
}
