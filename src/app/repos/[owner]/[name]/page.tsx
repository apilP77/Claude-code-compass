import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
      <h2 className="text-xl font-semibold leading-7 text-fg">{title}</h2>
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
          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
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
        <span className="font-mono">{repository.id}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="min-w-0">
          <header>
            <p className="font-mono text-sm text-faint">{repository.id}</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-[40px] sm:leading-[48px]">
              {repository.name}
            </h1>
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
                ? "AI-written summary; listing reviewed by an editor."
                : "AI-written from the README and not yet verified by an editor."}
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
                <h2 className="text-xl font-semibold leading-7">Pros</h2>
                <div className="mt-3">
                  <BulletList items={repository.pros} />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold leading-7">Cons</h2>
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
                  ? "AI-generated; listing reviewed."
                  : "AI-generated and unverified. Always read the source yourself."
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
              className="mt-8 rounded-xl border border-warn/25 bg-warn/10 p-4 text-sm leading-6 text-warn"
            >
              <strong className="font-semibold">Not editor-verified.</strong>{" "}
              Nobody on the team has reviewed this repository yet. Check its
              source and license before you use it.
            </aside>
          )}
        </article>

        <aside aria-label="Repository details" className="lg:sticky lg:top-20 lg:self-start">
          <a
            href={repository.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 w-full items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
          >
            View on GitHub
            <span className="sr-only"> (opens in a new tab)</span>
          </a>

          <dl className="mt-6 space-y-5 rounded-xl border border-line bg-surface p-5">
            <Fact label="Stars">
              {repository.stars !== null ? (
                <span className="font-mono text-star">
                  ★ {repository.stars.toLocaleString()}
                </span>
              ) : (
                <span className="text-faint">Unknown</span>
              )}
            </Fact>
            <Fact label="Forks">
              {repository.forks !== null ? (
                <span className="font-mono">{repository.forks.toLocaleString()}</span>
              ) : (
                <span className="text-faint">Unknown</span>
              )}
            </Fact>
            <Fact label="License">
              {repository.license_spdx ? (
                <span className="font-mono">{repository.license_spdx}</span>
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
                      className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted"
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
                <span className="font-mono text-xs">
                  {repository.ai_generated_at.slice(0, 10)}
                </span>
                {repository.ai_model && (
                  <span className="mt-0.5 block font-mono text-xs text-faint">
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
