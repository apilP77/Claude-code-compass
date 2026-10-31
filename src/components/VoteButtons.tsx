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
    <section className="mt-8 border-t border-slate-800 pt-6">
      <h2 className="text-sm font-semibold text-slate-200">
        Community score
      </h2>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          aria-label="Upvote"
          aria-pressed={userVote === 1}
          disabled={isLoading || isSubmitting}
          onClick={() => void castVote(1)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            userVote === 1
              ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-100 shadow-sm shadow-emerald-300/10"
              : "border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-300/30 hover:bg-emerald-300/10 hover:text-emerald-100"
          }`}
        >
          👍 Upvote
        </button>
        <button
          type="button"
          aria-label="Downvote"
          aria-pressed={userVote === -1}
          disabled={isLoading || isSubmitting}
          onClick={() => void castVote(-1)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            userVote === -1
              ? "border-rose-300/40 bg-rose-300/15 text-rose-100 shadow-sm shadow-rose-300/10"
              : "border-slate-700 bg-slate-900 text-slate-300 hover:border-rose-300/30 hover:bg-rose-300/10 hover:text-rose-100"
          }`}
        >
          👎 Downvote
        </button>
        <p aria-live="polite" className="ml-auto text-sm text-slate-400">
          Score:{" "}
          <span className="text-2xl font-bold tabular-nums text-white">
            {score ?? (isLoading ? "…" : "—")}
          </span>
        </p>
      </div>
      {errorMessage && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {errorMessage}
        </p>
      )}
    </section>
  );
}
