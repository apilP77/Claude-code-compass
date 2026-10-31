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
        const { error: signInError } = await supabase.auth.signInWithOAuth({
          provider: "github",
          options: { redirectTo: window.location.origin },
        });
        if (signInError) {
          throw new Error(`Could not start GitHub login: ${signInError.message}`);
        }
        return;
      }

      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId, voteType }),
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
      setUserVote(voteType);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not submit your vote.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-700">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Community score
      </h2>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          aria-label="Upvote"
          aria-pressed={userVote === 1}
          disabled={isLoading || isSubmitting}
          onClick={() => void castVote(1)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          👍 Upvote
        </button>
        <button
          type="button"
          aria-label="Downvote"
          aria-pressed={userVote === -1}
          disabled={isLoading || isSubmitting}
          onClick={() => void castVote(-1)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          👎 Downvote
        </button>
        <p aria-live="polite" className="text-sm text-zinc-600 dark:text-zinc-300">
          Score: {score ?? (isLoading ? "Loading…" : "—")}
        </p>
      </div>
      {errorMessage && (
        <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
          {errorMessage}
        </p>
      )}
    </section>
  );
}
