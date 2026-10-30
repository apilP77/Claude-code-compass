import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { repositories } from "@/lib/repos";

type RepositoryPageProps = {
  params: Promise<{ owner: string; name: string }>;
};

export function generateStaticParams() {
  return repositories.map(({ owner, name }) => ({ owner, name }));
}

async function findRepository(params: RepositoryPageProps["params"]) {
  const { owner, name } = await params;
  const id = `${owner}/${name}`.toLowerCase();
  return repositories.find((repository) => repository.id === id);
}

export async function generateMetadata({
  params,
}: RepositoryPageProps): Promise<Metadata> {
  const repository = await findRepository(params);

  if (!repository) {
    return {
      title: "Repository not found",
      description: "This repository is not in the Claude Code Compass directory.",
    };
  }

  return {
    title: repository.name,
    description: repository.description,
  };
}

export default async function RepositoryPage({ params }: RepositoryPageProps) {
  const repository = await findRepository(params);

  if (!repository) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
      <Link
        href="/"
        className="text-sm font-medium text-teal-800 underline underline-offset-4 hover:text-teal-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 dark:text-teal-300 dark:hover:text-teal-200 dark:focus-visible:outline-teal-300"
      >
        Back to directory
      </Link>

      <article className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-9 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
          {repository.id}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
          {repository.name}
        </h1>
        <p className="mt-6 text-base leading-7 text-zinc-700 dark:text-zinc-300">
          {repository.description}
        </p>

        <dl className="mt-8 grid gap-6 border-t border-zinc-200 pt-6 sm:grid-cols-2 dark:border-zinc-700">
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Category
            </dt>
            <dd className="mt-2">
              <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-sm font-medium capitalize text-teal-800 dark:bg-teal-950 dark:text-teal-200">
                {repository.category}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              License
            </dt>
            <dd className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {repository.license_spdx ?? "No license detected"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Tags
            </dt>
            <dd className="mt-2">
              {repository.tags.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {repository.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  No tags recorded
                </span>
              )}
            </dd>
          </div>
        </dl>

        {repository.listing_status !== "reviewed" && (
          <aside
            role="note"
            className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100"
          >
            <strong>Unreviewed listing.</strong> This repository has not been
            verified by an editor. Review its source and license before use.
          </aside>
        )}

        <a
          href={repository.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex rounded-xl bg-teal-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:bg-teal-300 dark:text-teal-950 dark:hover:bg-teal-200 dark:focus-visible:outline-teal-300"
        >
          View on GitHub
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </article>
    </main>
  );
}
