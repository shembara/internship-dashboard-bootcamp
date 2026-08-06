"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithEmailAndPassword,
  signInWithRedirect,
  type UserCredential,
} from "firebase/auth";
import { LoaderCircle, LogIn } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { getClientEnvironment } from "@/lib/env/client";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

const localPersonas = [
  {
    id: "manager2",
    name: "Sasha Manager",
    email: "manager@fluxon.com",
  },
  {
    id: "mentor2",
    name: "Sasga Mentor",
    email: "mentor@fluxon.com",
  },
  {
    id: "intern",
    name: "Sasha Intern",
    email: "intern@fluxon.com",
  },
  {
    id: "guest",
    name: "Sasha Guest",
    email: "guest@fluxon.com",
  },
] as const;

async function establishServerSession(credential: UserCredential): Promise<void> {
  const idToken = await credential.user.getIdToken();
  const response = await fetch("/api/auth/session", {
    body: JSON.stringify({ idToken }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => undefined)) as
      | { error?: string }
      | undefined;
    throw new Error(
      result?.error ?? "Unable to create an application session.",
    );
  }
}

export function SignInCard() {
  const environment = getClientEnvironment();
  const [pendingPersona, setPendingPersona] = useState<string>();
  const [error, setError] = useState<string>();
  const [isResolvingRedirect, setIsResolvingRedirect] = useState(true);

  async function finishSignIn(credential: UserCredential) {
    await establishServerSession(credential);
    window.location.assign("/");
  }

  useEffect(() => {
    let isMounted = true;

    // Google's Cross-Origin-Opener-Policy on accounts.google.com can block the
    // postMessage/window.close signal signInWithPopup relies on, so Google
    // sign-in uses a full-page redirect instead. This effect picks the result
    // back up after the browser returns from Google.
    async function resolveRedirectSignIn() {
      try {
        const auth = getFirebaseClientAuth();
        const credential = await getRedirectResult(auth);
        if (credential) {
          await finishSignIn(credential);
          return;
        }
      } catch (redirectError) {
        if (isMounted) {
          setError(
            redirectError instanceof Error
              ? redirectError.message
              : "Google sign-in failed.",
          );
        }
      }
      if (isMounted) setIsResolvingRedirect(false);
    }

    void resolveRedirectSignIn();

    return () => {
      isMounted = false;
    };
  }, []);

  async function signInWithGoogle() {
    setError(undefined);
    setPendingPersona("google");

    try {
      const auth = getFirebaseClientAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });
      await signInWithRedirect(auth, provider);
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Google sign-in failed.",
      );
      setPendingPersona(undefined);
    }
  }

  async function signInAsLocalPersona(
    persona: (typeof localPersonas)[number],
  ) {
    setError(undefined);
    setPendingPersona(persona.id);

    try {
      const auth = getFirebaseClientAuth();
      await finishSignIn(
        await signInWithEmailAndPassword(
          auth,
          persona.email,
          "local-only-password",
        ),
      );
    } catch (signInError) {
      const message =
        signInError instanceof Error
          ? signInError.message
          : "Local sign-in failed.";
      setError(
        message.includes("user-not-found") || message.includes("invalid-credential")
          ? `${message} (Make sure you ran: FIREBASE_AUTHENTICATION_MODE=email-password-development npx tsx scripts/seed-development.ts)`
          : message,
      );
      setPendingPersona(undefined);
    }
  }

  if (isResolvingRedirect) {
    return (
      <section className="flex w-full max-w-md items-center justify-center rounded-3xl border bg-card p-7 shadow-[0_24px_80px_rgba(22,78,63,0.10)] sm:p-9">
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
      </section>
    );
  }

  return (
    <section className="w-full max-w-md rounded-3xl border bg-card p-7 shadow-[0_24px_80px_rgba(22,78,63,0.10)] sm:p-9">
      <div className="mb-8">
        <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-[var(--brand)] text-sm font-bold text-white">
          F
        </div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
          Fluxon
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Internship Dashboard
        </h1>
        <p className="mt-3 leading-6 text-muted-foreground">
          Sign in using your corporate (@fluxon.com) or university (@ucu.edu.ua) Google account.
        </p>
      </div>

      {environment.authenticationMode === "email-password-development" ? (
        <div className="space-y-4">
          <div>
            <p className="mb-3 text-sm font-medium">Local development personas</p>
            <div className="grid grid-cols-2 gap-2">
              {localPersonas.map((persona) => (
                <Button
                  key={persona.id}
                  type="button"
                  variant="outline"
                  className="h-auto justify-start px-3 py-3"
                  disabled={Boolean(pendingPersona)}
                  onClick={() => signInAsLocalPersona(persona)}
                >
                  {pendingPersona === persona.id ? (
                    <LoaderCircle className="animate-spin" />
                  ) : null}
                  <span className="text-left">
                    <span className="block">Authenticate as {persona.id}</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {persona.email}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Personas use only the Firebase development project.
            </p>
          </div>
          <div className="relative flex items-center py-1">
            <div className="grow border-t border-border" />
            <span className="shrink mx-3 text-xs uppercase text-muted-foreground">Or</span>
            <div className="grow border-t border-border" />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="h-10 w-full"
            disabled={Boolean(pendingPersona)}
            onClick={signInWithGoogle}
          >
            {pendingPersona === "google" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <LogIn />
            )}
            Continue with Google
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          className="h-11 w-full"
          disabled={Boolean(pendingPersona)}
          onClick={signInWithGoogle}
        >
          {pendingPersona === "google" ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <LogIn />
          )}
          Continue with Google
        </Button>
      )}

      {error ? (
        <div
          className="mt-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </section>
  );
}
