"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

export function SignOutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSignOut() {
    setPending(true);
    setError(undefined);

    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST" });
      if (!response.ok) {
        throw new Error("Unable to end the server session.");
      }
      await signOut(getFirebaseClientAuth()).catch(() => undefined);
      window.location.assign("/sign-in");
    } catch (signOutError) {
      setError(
        signOutError instanceof Error ? signOutError.message : "Unable to sign out.",
      );
      setPending(false);
    }
  }

  return (
    <div>
      <Button
        aria-label="Sign out"
        disabled={pending}
        onClick={handleSignOut}
        size="sm"
        variant="ghost"
      >
        <LogOut />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
      {error ? (
        <span className="sr-only" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
