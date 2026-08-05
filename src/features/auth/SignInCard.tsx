"use client";

import { useState } from "react";
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
    role: "Manager",
    name: "Maya Manager",
    email: "manager@fluxon.com",
  },
  {
    id: "mentor2",
    role: "Mentor",
    name: "Morgan Mentor",
    email: "mentor@fluxon.com",
  },
  {
    id: "intern",
    role: "Intern",
    name: "Indira Intern",
    email: "intern@fluxon.com",
  },
  {
    id: "guest",
    role: "Guest",
    name: "Data Guest",
    email: "guest@fluxon.com",
  },
] as const;

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 18 18">
      <path
        d="M17.82 3.797A8.93 8.93 0 0 0 9 0a9 9 0 0 0 0 18c3.045 0 5.67-1.553 7.02-3.916l-2.41-1.87A5.4 5.4 0 1 1 14.58 6H9v3.593h5.46a5.1 5.1 0 0 1-.91 2.62l2.37 1.84A8.98 8.98 0 0 0 17.82 3.797Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c3.045 0 5.67-1.553 7.02-3.916l-2.41-1.87A5.37 5.37 0 0 1 9 14.4a5.4 5.4 0 0 1-5.055-3.48l-2.49 1.93A9 9 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.945 10.92A5.4 5.4 0 0 1 3.6 9c0-.67.12-1.31.345-1.92V4.8H1.53A8.96 8.96 0 0 0 0 9c0 1.62.427 3.14 1.17 4.45l2.49-1.93.285-.6Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.6c1.49 0 2.825.513 3.875 1.52l2.35-2.35A8.95 8.95 0 0 0 9 0a9 9 0 0 0-7.47 3.97l2.415 1.93A5.4 5.4 0 0 1 9 3.6Z"
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
      { error?: string } | undefined;
    throw new Error(result?.error ?? "Unable to create an application session.");
  }
}

export function SignInCard() {
  const environment = getClientEnvironment();
  const [pendingPersona, setPendingPersona] = useState<string>();
  const [error, setError] = useState<string>();

  async function finishSignIn(credential: UserCredential) {
    await establishServerSession(credential);
    window.location.assign("/");
  }

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
        signInError instanceof Error ? signInError.message : "Google sign-in failed.",
      );
      setPendingPersona(undefined);
    }
  }

  async function signInAsLocalPersona(persona: (typeof localPersonas)[number]) {
    setError(undefined);
    setPendingPersona(persona.id);

    try {
      const auth = getFirebaseClientAuth();
      await finishSignIn(
        await signInWithEmailAndPassword(auth, persona.email, "local-only-password"),
      );
    } catch (signInError) {
      const message =
        signInError instanceof Error ? signInError.message : "Local sign-in failed.";
      setError(
        message.includes("user-not-found") || message.includes("invalid-credential")
          ? `${message} (Make sure you ran: FIREBASE_AUTHENTICATION_MODE=email-password-development npx tsx scripts/seed-development.ts)`
          : message,
      );
      setPendingPersona(undefined);
    }
  }

  return (
    <section className="w-full max-w-[420px] rounded-[24px] border border-white/[0.08] bg-[#121a20] p-7 text-[#f3f4f6] shadow-[0_20px_50px_rgba(0,0,0,0.5)] sm:p-9">
      <div className="mb-7 text-center">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-[14px] border border-white/[0.08] bg-[#19242c] text-xl font-bold text-[#00e5a3] shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          F
        </div>
        <h1 className="text-[22px] leading-[1.11] font-medium tracking-tight">
          Sign in to Internship Platform
        </h1>
        <p className="mt-4 text-[13px] leading-[1.5] text-[#9ca3af]">
          Use your verified Google account to access your workspace, track progress, or
          manage team placements.
        </p>
      </div>

      <div className="space-y-6">
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-xl border-white/[0.08] bg-[#19242c] text-sm font-medium text-[#f3f4f6] hover:bg-[#23313a] hover:text-[#f3f4f6]"
          disabled={Boolean(pendingPersona)}
          onClick={signInWithGoogle}
        >
          {pendingPersona === "google" ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <GoogleMark />
          )}
          Sign in with Google
        </Button>

        {environment.authenticationMode === "email-password-development" ? (
          <div className="border-t border-white/[0.08] pt-6">
            <p className="text-center text-[11px] leading-[1.14] font-medium tracking-[0.05em] text-[#f59e0b] uppercase">
              🛠️ Developer Tools
            </p>
            <p className="mt-2 text-center text-xs leading-[1.13] text-[#9ca3af]">
              Authenticate directly as test roles:
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {localPersonas.map((persona) => (
                <Button
                  key={persona.id}
                  type="button"
                  variant="outline"
                  className="h-auto min-h-[62px] flex-col gap-1 rounded-[10px] border-white/[0.08] bg-[#19242c] px-3 py-3 text-[#f3f4f6] hover:bg-[#23313a] hover:text-[#f3f4f6]"
                  disabled={Boolean(pendingPersona)}
                  onClick={() => signInAsLocalPersona(persona)}
                  aria-label={`Authenticate as ${persona.id}: ${persona.role}, ${persona.name}, ${persona.email}`}
                >
                  {pendingPersona === persona.id ? (
                    <LoaderCircle className="animate-spin" />
                  ) : null}
                  <span className="text-xs leading-[1.13]">{persona.role}</span>
                  <span className="text-[11px] leading-[1.14] font-medium text-[#9ca3af]">
                    {persona.name}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <div
          className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </section>
  );
}
