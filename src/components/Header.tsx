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
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 shadow-lg shadow-black/10 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-white transition-colors hover:text-cyan-200"
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
              <span className="max-w-40 truncate text-sm text-slate-300">
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
              className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50"
            >
              Log Out
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void logIn()}
            className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-sm shadow-cyan-300/10 transition hover:bg-cyan-300/20 disabled:opacity-50"
          >
            Log In
          </button>
        )}
      </div>
      {errorMessage && (
        <p role="alert" className="mx-auto max-w-6xl px-5 pb-3 text-sm text-red-300 sm:px-8">
          {errorMessage}
        </p>
      )}
    </header>
  );
}
