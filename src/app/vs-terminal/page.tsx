"use client";

import React from "react";
import { VsTerminal } from "@/components/terminal/VsTerminal";

export default function VsTerminalPage() {
  return (
    <div className="container mx-auto p-4 h-screen">
      <div className="h-[calc(100vh-8rem)]">
        <VsTerminal />
      </div>
    </div>
  );
}
