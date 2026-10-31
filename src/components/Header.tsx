"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export default function Header() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    void supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!active) {
          return;
        }
        if (error) {
          setErrorMessage(`Could not load login status: ${error.message}`);
          return;
        }
        setUser(data.user);
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? `Could not load login status: ${error.message}`
              : "Could not load login status.",
          );
        }
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function logIn() {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `Could not start GitHub login: ${error.message}`
          : "Could not start GitHub login.",
      );
      setIsSubmitting(false);
    }
  }

  async function logOut() {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `Could not log out: ${error.message}`
          : "Could not log out.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const avatarUrl =
    typeof user?.user_metadata.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;
  const email = user?.email ?? "Signed in";

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-zinc-950 dark:text-white"
        >
          Claude Code Compass
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <span className="max-w-40 truncate text-sm text-zinc-700 dark:text-zinc-200">
                {email}
              </span>
            )}
            {avatarUrl && (
              <span className="sr-only">{email}</span>
            )}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void logOut()}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Log Out
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void logIn()}
            className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50 dark:bg-teal-300 dark:text-teal-950 dark:hover:bg-teal-200"
          >
            Log In
          </button>
        )}
      </div>
      {errorMessage && (
        <p role="alert" className="mx-auto max-w-6xl px-5 pb-3 text-sm text-red-700 sm:px-8 dark:text-red-300">
          {errorMessage}
        </p>
      )}
    </header>
  );
}
