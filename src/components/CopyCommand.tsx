"use client";

import { useState } from "react";

export default function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-2 flex items-stretch gap-2">
      <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 font-mono text-sm whitespace-pre text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
        {command}
      </code>
      <button
        type="button"
        onClick={() => void copy()}
        aria-live="polite"
        className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus-visible:outline-teal-300"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
