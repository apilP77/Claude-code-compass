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
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre rounded-md border border-line-strong bg-ink px-4 py-3 font-mono text-sm text-bg">
        {command}
      </code>
      <button
        type="button"
        onClick={() => void copy()}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-fg transition-colors hover:border-ink"
      >
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {state === "copied" ? (
            <path d="m3 8.5 3.2 3.2L13 4.5" />
          ) : (
            <>
              <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
              <path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
            </>
          )}
        </svg>
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy command"}
      </button>
      <span aria-live="polite" className="sr-only">
        {state === "copied" ? "Command copied to clipboard" : ""}
      </span>
    </div>
  );
}
