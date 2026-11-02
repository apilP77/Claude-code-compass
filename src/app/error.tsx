"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
      <p className="text-sm text-faint">Error</p>
      <h1 className="mt-3 display text-3xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-lg text-[15px] leading-6 text-muted">
        The page failed to load. Try again, and if it keeps happening, open an
        issue on GitHub.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex min-h-11 items-center rounded-md bg-ink px-5 text-sm font-semibold text-bg transition-colors hover:bg-accent"
      >
        Try again
      </button>
    </main>
  );
}
