export default async function EditorPage({
  params,
}: {
  params: { filePath: string };
}) {
  const filePath = params.filePath;

  return <div className="flex flex-col h-full">editor {filePath}</div>;
}
