import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import CategorySymbol from "@/components/CategorySymbol";
import CopyCommand from "@/components/CopyCommand";
import ListingBadge from "@/components/ListingBadge";
import VoteButtons from "@/components/VoteButtons";
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
    description: repository.summary ?? repository.description,
  };
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 border-t border-line pt-6">
      <h2 className="display text-xl">{title}</h2>
      {note && <p className="mt-1 text-[13px] leading-5 text-faint">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2 text-[15px] leading-6 text-muted">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-accent" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[13px] text-faint">{label}</dt>
      <dd className="mt-1 text-sm text-fg">{children}</dd>
    </div>
  );
}

export default async function RepositoryPage({ params }: RepositoryPageProps) {
  const repository = await findRepository(params);

  if (!repository) {
    notFound();
  }

  const isReviewed = repository.listing_status === "reviewed";

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-faint">
        <Link href="/" className="rounded text-muted transition-colors hover:text-accent">
          Directory
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span >{repository.id}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="min-w-0">
          <header>
            <p className="flex items-center gap-2 text-sm capitalize text-faint">
              <CategorySymbol category={repository.category} />
              {repository.category}
              <span className="normal-case">by {repository.owner}</span>
            </p>
            <ViewTransition name={`repo-${repository.id}`} share="morph" default="none">
              <h1 className="display mt-3 text-4xl sm:text-5xl">{repository.name}</h1>
            </ViewTransition>
            <div className="mt-4">
              <ListingBadge repository={repository} />
            </div>
          </header>

          <p className="mt-6 max-w-[65ch] text-base leading-7 text-muted">
            {repository.summary ?? repository.description}
          </p>
          {repository.summary && (
            <p className="mt-2 text-[13px] leading-5 text-ai">
              {isReviewed
                ? "AI-written summary; listing picked by an editor."
                : "AI-written from the README."}
            </p>
          )}

          {repository.best_for && (
            <Section title="Best for">
              <p className="max-w-[65ch] text-[15px] leading-6 text-muted">
                {repository.best_for}
              </p>
            </Section>
          )}

          {repository.highlights && (
            <Section title="Highlights">
              <BulletList items={repository.highlights} />
            </Section>
          )}

          {repository.getting_started && (
            <Section
              title="Getting started"
              note="Quoted from the project's README. Read it before you run it."
            >
              <CopyCommand command={repository.getting_started} />
            </Section>
          )}

          {repository.pros && repository.cons && (
            <section className="mt-8 grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
              <div>
                <h2 className="display text-xl">Pros</h2>
                <div className="mt-3">
                  <BulletList items={repository.pros} />
                </div>
              </div>
              <div>
                <h2 className="display text-xl">Cons</h2>
                <div className="mt-3">
                  <BulletList items={repository.cons} />
                </div>
              </div>
            </section>
          )}

          {repository.security_notes && (
            <Section
              title="Security notes"
              note={
                isReviewed
                  ? "AI-generated; listing picked by an editor."
                  : "AI-generated and unchecked. Always read the source yourself."
              }
            >
              <p className="max-w-[65ch] whitespace-pre-wrap text-[15px] leading-6 text-muted">
                {repository.security_notes}
              </p>
            </Section>
          )}

          <VoteButtons repositoryId={repository.id} />

          {!isReviewed && (
            <aside
              role="note"
              className="mt-8 rounded-[10px] border border-line-strong bg-surface p-4 text-sm leading-6 text-muted"
            >
              <strong className="font-semibold text-fg">Community listing.</strong>{" "}
              Check the source and license before you use it.
            </aside>
          )}
        </article>

        <aside aria-label="Repository details" className="lg:sticky lg:top-20 lg:self-start">
          <a
            href={repository.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 w-full items-center justify-center rounded-md bg-ink px-5 text-sm font-semibold text-bg transition-colors hover:bg-accent"
          >
            Open on GitHub
            <span className="sr-only"> (opens in a new tab)</span>
          </a>

          <h2 className="display mt-8 text-lg">At a glance</h2>
          <dl className="mt-3 space-y-5 rounded-[10px] border border-line-strong bg-surface p-5">
            <Fact label="Stars">
              {repository.stars !== null ? (
                <span className="font-semibold text-star">
                  ★ {repository.stars.toLocaleString()}
                </span>
              ) : (
                <span className="text-faint">Unknown</span>
              )}
            </Fact>
            <Fact label="Forks">
              {repository.forks !== null ? (
                <span >{repository.forks.toLocaleString()}</span>
              ) : (
                <span className="text-faint">Unknown</span>
              )}
            </Fact>
            <Fact label="License">
              {repository.license_spdx ? (
                <span >{repository.license_spdx}</span>
              ) : (
                <span className="text-warn">No license detected</span>
              )}
            </Fact>
            <Fact label="Category">
              <span className="capitalize">{repository.category}</span>
            </Fact>
            <Fact label="Tags">
              {repository.tags.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {repository.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded border border-line-strong px-2 py-0.5 text-[13px] text-muted"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-faint">None recorded</span>
              )}
            </Fact>
            {repository.ai_generated_at && (
              <Fact label="AI text generated">
                <span className="text-xs">
                  {repository.ai_generated_at.slice(0, 10)}
                </span>
                {repository.ai_model && (
                  <span className="mt-0.5 block text-xs text-faint">
                    {repository.ai_model}
                  </span>
                )}
              </Fact>
            )}
          </dl>
        </aside>
      </div>
    </main>
  );
}
