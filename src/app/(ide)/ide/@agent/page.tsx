"use client";

import Link from "next/link";
import { useIDEStore } from "@/store/ide-store";
import { Codex } from "@/components/terminal/Codex";

export default function Agent() {
  const currentAgent = useIDEStore((state) => state.currentAgent);

  return (
    <div className="flex flex-col h-full p-4">
      <Codex />
    </div>
  );
}
