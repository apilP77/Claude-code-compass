"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import Compass from "@/components/Compass";
import ThemeToggle from "@/components/ThemeToggle";
import { createBrowserSupabaseClient, isSessionMissing } from "@/lib/supabase";

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
        if (error && !isSessionMissing(error)) {
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
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname + window.location.search)}` },
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
    <header className="sticky top-0 z-50 border-b border-line bg-bg">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 display text-lg text-fg transition-colors hover:text-accent"
        >
          <Compass className="h-7 w-7 shrink-0" bearing={0} lost={false} />
          Claude Code Compass
        </Link>

        <nav aria-label="Account" className="flex items-center gap-3">
          <Link
            href="/skill-set"
            className="rounded-md border border-accent px-3 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-bg whitespace-nowrap"
          >
            <span className="sm:hidden">Skill finder</span>
            <span className="hidden sm:inline">Skill set finder</span>
          </Link>
          <ThemeToggle />
          <a
            href="https://github.com/apilP77/Claude-code-compass"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-fg sm:inline-flex"
          >
            GitHub
            <span className="sr-only"> (opens in a new tab)</span>
          </a>

          {user ? (
            <>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full border border-line object-cover"
                />
              ) : (
                <span className="max-w-40 truncate text-sm text-muted">
                  {email}
                </span>
              )}
              {avatarUrl && <span className="sr-only">{email}</span>}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void logOut()}
                className="min-h-10 rounded-md border border-line px-4 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-surface-2 disabled:opacity-50"
              >
                Log out
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void logIn()}
              className="min-h-10 rounded-md bg-ink px-4 text-sm font-semibold text-bg transition-colors hover:bg-accent disabled:opacity-50"
            >
              Sign in with GitHub
            </button>
          )}
        </nav>
      </div>
      {errorMessage && (
        <p
          role="alert"
          className="mx-auto max-w-6xl px-5 pb-3 text-sm text-danger sm:px-8"
        >
          {errorMessage}
        </p>
      )}
    </header>
  );
}
