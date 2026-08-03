"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";

export function ProvisionUserForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/manager/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        roles,
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Unable to provision access.");
      setPending(false);
      return;
    }
    router.refresh();
  }
  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm"
    >
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="person@example.com"
          className="h-10 rounded-lg border bg-background px-3"
        />
      </label>
      <fieldset className="flex gap-4 text-sm">
        <legend className="mb-2 font-medium">Application access</legend>
        <label className="flex items-center gap-2">
          <input
            name="roles"
            type="checkbox"
            value="intern"
            checked={roles.includes("intern")}
            onChange={(event) =>
              setRoles((current) =>
                event.target.checked
                  ? [...current, "intern"]
                  : current.filter((role) => role !== "intern"),
              )
            }
          />{" "}
          Intern
        </label>
        <label className="flex items-center gap-2">
          <input
            name="roles"
            type="checkbox"
            value="teammate"
            checked={roles.includes("teammate")}
            onChange={(event) =>
              setRoles((current) =>
                event.target.checked
                  ? [...current, "teammate"]
                  : current.filter((role) => role !== "teammate"),
              )
            }
          />{" "}
          Teammate
        </label>
      </fieldset>
      <p className="text-xs text-muted-foreground">
        The person can sign in later; their access is bound to that verified email on
        first sign-in.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Provisioning…" : "Provision access"}
      </Button>
    </form>
  );
}
