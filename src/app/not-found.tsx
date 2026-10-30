import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
      <p className="text-sm font-semibold tracking-[0.2em] text-teal-700 uppercase dark:text-teal-300">
        404 · Not found
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
        We couldn’t find that repository
      </h1>
      <p className="mt-3 max-w-lg text-base leading-7 text-zinc-600 dark:text-zinc-300">
        It may have moved, or it may not be part of the directory yet.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-teal-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:bg-teal-300 dark:text-teal-950 dark:hover:bg-teal-200 dark:focus-visible:outline-teal-300"
      >
        Return to homepage
      </Link>
    </main>
  );
}
