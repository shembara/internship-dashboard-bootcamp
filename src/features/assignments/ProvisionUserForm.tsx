"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { managerTheme } from "@/lib/manager-workspace/theme";
import { cn } from "@/lib/utils";

export function ProvisionUserForm({ variant }: { variant?: "dark" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const dark = variant === "dark";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!role) {
      setError("Please select an application role.");
      return;
    }
    setPending(true);
    setError("");
    const response = await fetch("/api/manager/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        roles: [role],
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Unable to provision access.");
      setPending(false);
      return;
    }
    setEmail("");
    setRole("");
    setPending(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "space-y-4 rounded-2xl border p-6",
        dark
          ? cn(managerTheme.card, "shadow-none")
          : "border bg-card shadow-sm",
      )}
    >
      <label className="grid gap-2">
        <span className={dark ? managerTheme.label : "text-sm font-medium"}>
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="person@example.com"
          className={dark ? managerTheme.input : "h-10 rounded-lg border bg-background px-3"}
        />
      </label>
      <fieldset className="flex flex-wrap gap-4 text-sm">
        <legend className={cn("mb-2", dark ? managerTheme.label : "font-medium")}>
          Application role
        </legend>
        <label className={cn("flex cursor-pointer items-center gap-2", dark ? "text-[#c9d1d9]" : undefined)}>
          <input
            name="role"
            type="radio"
            value="manager"
            checked={role === "manager"}
            onChange={(event) => setRole(event.target.value)}
          />{" "}
          Manager
        </label>
        <label className={cn("flex cursor-pointer items-center gap-2", dark ? "text-[#c9d1d9]" : undefined)}>
          <input
            name="role"
            type="radio"
            value="intern"
            checked={role === "intern"}
            onChange={(event) => setRole(event.target.value)}
          />{" "}
          Intern
        </label>
        <label className={cn("flex cursor-pointer items-center gap-2", dark ? "text-[#c9d1d9]" : undefined)}>
          <input
            name="role"
            type="radio"
            value="teammate"
            checked={role === "teammate"}
            onChange={(event) => setRole(event.target.value)}
          />{" "}
          Teammate / Mentor
        </label>
      </fieldset>
      <p className={cn("text-xs", dark ? managerTheme.muted : "text-muted-foreground")}>
        The person can sign in later; their access is bound to that verified email on
        first sign-in.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className={dark ? cn(managerTheme.primaryButton, "h-10 px-4") : undefined}
      >
        {pending ? "Provisioning…" : "Provision access"}
      </Button>
    </form>
  );
}
