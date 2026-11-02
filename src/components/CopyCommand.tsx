"use client";

import { useState } from "react";

export default function CopyCommand({ command }: { command: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <div className="flex items-stretch gap-2">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre rounded-lg border border-line bg-surface-2 px-4 py-3 font-mono text-sm text-fg">
        {command}
      </code>
      <button
        type="button"
        onClick={() => void copy()}
        className="min-h-11 shrink-0 rounded-lg border border-line px-4 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-surface-2"
      >
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy"}
      </button>
      <span aria-live="polite" className="sr-only">
        {state === "copied" ? "Command copied to clipboard" : ""}
      </span>
    </div>
  );
}
