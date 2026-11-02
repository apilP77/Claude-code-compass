import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
      <p className="font-mono text-sm text-faint">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">
        We couldn’t find that repository
      </h1>
      <p className="mt-3 max-w-lg text-[15px] leading-6 text-muted">
        It may have moved, or it may not be part of the directory yet.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
      >
        Back to the directory
      </Link>
    </main>
  );
}
