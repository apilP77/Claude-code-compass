"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type VoteButtonsProps = {
  repositoryId: string;
};

export default function VoteButtons({ repositoryId }: VoteButtonsProps) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [score, setScore] = useState<number | null>(null);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadVoteState() {
      setIsLoading(true);
      setErrorMessage(null);

      const [scoreResult, userResult] = await Promise.all([
        supabase.rpc("get_repository_vote_score", {
          repository_id_input: repositoryId,
        }),
        supabase.auth.getUser(),
      ]);

      if (!active) {
        return;
      }

      if (scoreResult.error) {
        setErrorMessage(`Could not load vote score: ${scoreResult.error.message}`);
        setIsLoading(false);
        return;
      }

      if (typeof scoreResult.data !== "number") {
        setErrorMessage("Could not load vote score: the server returned an invalid value.");
        setIsLoading(false);
        return;
      }

      if (userResult.error) {
        setErrorMessage(`Could not check your login status: ${userResult.error.message}`);
        setIsLoading(false);
        return;
      }

      setScore(scoreResult.data);
      const user = userResult.data.user;
      setSignedIn(Boolean(user));
      if (user) {
        const voteResult = await supabase
          .from("votes")
          .select("vote_type")
          .eq("repository_id", repositoryId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!active) {
          return;
        }

        if (voteResult.error) {
          setErrorMessage(`Could not load your vote: ${voteResult.error.message}`);
        } else {
          setUserVote(voteResult.data?.vote_type ?? null);
        }
      } else {
        setUserVote(null);
      }

      setIsLoading(false);
    }

    void loadVoteState().catch((error: unknown) => {
      if (active) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load vote data.",
        );
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [repositoryId, supabase]);

  async function castVote(voteType: 1 | -1) {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        throw new Error(`Could not check your login status: ${error.message}`);
      }

      if (!data.user) {
        setErrorMessage("Redirecting to GitHub to sign in…");
        const { error: signInError } = await supabase.auth.signInWithOAuth({
          provider: "github",
          options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname + window.location.search)}` },
        });
        if (signInError) {
          throw new Error(`Could not start GitHub login: ${signInError.message}`);
        }
        return;
      }

      const removing = userVote === voteType;
      const response = await fetch("/api/votes", {
        method: removing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          removing ? { repositoryId } : { repositoryId, voteType },
        ),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Could not save your vote.";
        throw new Error(message);
      }

      if (
        typeof result !== "object" ||
        result === null ||
        !("score" in result) ||
        typeof result.score !== "number" ||
        !Number.isInteger(result.score)
      ) {
        throw new Error("The vote service returned an invalid score.");
      }

      setScore(result.score);
      setUserVote(removing ? null : voteType);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not submit your vote.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-8 border-t border-line pt-6">
      <h2 className="text-xl font-semibold leading-7">Community score</h2>
      <div className="mt-3 flex items-center gap-3">
        <div
          role="group"
          aria-label="Vote on this repository"
          className="inline-flex items-center overflow-hidden rounded-lg border border-line"
        >
          <button
            type="button"
            aria-label={userVote === 1 ? "Remove upvote" : "Upvote"}
            aria-pressed={userVote === 1}
            disabled={isLoading || isSubmitting}
            onClick={() => void castVote(1)}
            className={`min-h-11 min-w-11 px-3 text-base transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              userVote === 1
                ? "bg-accent/15 text-accent"
                : "text-muted hover:bg-surface-2 hover:text-fg"
            }`}
          >
            <span aria-hidden="true">▲</span>
          </button>
          <p
            aria-live="polite"
            className="min-w-12 border-x border-line px-3 text-center font-mono text-base tabular-nums text-fg"
          >
            {score ?? (isLoading ? "…" : "—")}
            <span className="sr-only"> points</span>
          </p>
          <button
            type="button"
            aria-label={userVote === -1 ? "Remove downvote" : "Downvote"}
            aria-pressed={userVote === -1}
            disabled={isLoading || isSubmitting}
            onClick={() => void castVote(-1)}
            className={`min-h-11 min-w-11 px-3 text-base transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              userVote === -1
                ? "bg-danger/15 text-danger"
                : "text-muted hover:bg-surface-2 hover:text-fg"
            }`}
          >
            <span aria-hidden="true">▼</span>
          </button>
        </div>
        {signedIn === false && (
          <p className="text-sm text-muted">Sign in with GitHub to vote.</p>
        )}
      </div>
      <p className="mt-3 text-[13px] leading-5 text-faint">
        Votes measure opinion, not security or correctness.
      </p>
      {errorMessage && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {errorMessage}
        </p>
      )}
    </section>
  );
}
