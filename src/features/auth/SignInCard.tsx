"use client";

import { useCallback, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";
import { LoaderCircle } from "lucide-react";

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

const personaRoleLabels: Record<(typeof localPersonas)[number]["id"], string> = {
  intern: "Intern",
  manager2: "Manager",
  mentor2: "Mentor",
  guest: "Guest",
};

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="size-5 shrink-0" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

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

  const finishSignIn = useCallback(async (credential: UserCredential) => {
    await establishServerSession(credential);
    window.location.assign("/");
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
      await finishSignIn(await signInWithPopup(auth, provider));
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

  const googleButtonClassName =
    "h-11 w-full gap-3 rounded-lg border border-white/15 bg-[#0d1117] text-sm font-medium text-white hover:border-white/25 hover:bg-white/5 disabled:opacity-50";

  return (
    <section className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#161b22] p-8 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 text-sm font-bold text-white shadow-[0_0_24px_rgba(45,212,191,0.35)]">
          F
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
          Sign in to Internship Platform
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#8b949e]">
          Use your verified Google account to access your workspace, track
          progress, or manage team placements.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className={googleButtonClassName}
        disabled={Boolean(pendingPersona)}
        onClick={signInWithGoogle}
      >
        {pendingPersona === "google" ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Sign in with Google
      </Button>

      {environment.authenticationMode === "email-password-development" ? (
        <div className="mt-8 border-t border-white/10 pt-8">
          <p className="mb-1 text-center text-xs font-semibold uppercase tracking-[0.14em] text-amber-500">
            🛠 Developer Tools
          </p>
          <p className="mb-4 text-center text-sm text-[#8b949e]">
            Authenticate directly as test roles:
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {localPersonas.map((persona) => (
              <Button
                key={persona.id}
                type="button"
                variant="outline"
                aria-label={`Authenticate as ${persona.id}`}
                className="h-auto flex-col items-center justify-center gap-1 rounded-lg border-white/15 bg-[#0d1117] px-3 py-3.5 text-white hover:border-white/25 hover:bg-white/5 disabled:opacity-50"
                disabled={Boolean(pendingPersona)}
                onClick={() => signInAsLocalPersona(persona)}
              >
                {pendingPersona === persona.id ? (
                  <LoaderCircle className="animate-spin" />
                ) : null}
                <span className="block text-sm font-medium">
                  {personaRoleLabels[persona.id]}
                </span>
                <span className="block text-xs font-normal text-[#8b949e]">
                  {persona.name}
                </span>
              </Button>
            ))}
          </div>
          <p className="mt-3 text-center text-xs leading-5 text-[#6e7681]">
            Personas use only the Firebase development project.
          </p>
        </div>
      ) : null}

      {error ? (
        <div
          className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </section>
  );
}
