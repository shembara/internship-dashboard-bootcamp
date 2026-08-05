"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { applicationRoles, type ApplicationRole } from "@/lib/users/roles";

export function ProvisionUserForm({
  availableRoles = applicationRoles.map((role) => role.value),
}: {
  availableRoles?: readonly ApplicationRole[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

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
      className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#121a20] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:p-6"
    >
      <label className="grid gap-2 text-[11px] font-medium tracking-[0.08em] text-[#9ca3af] uppercase">
        Email
        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="person@example.com"
          className="h-11 rounded-xl border border-white/[0.08] bg-[#19242c] px-3 text-sm font-normal tracking-normal text-[#f3f4f6] normal-case placeholder:text-[#757575]"
        />
      </label>
      <fieldset>
        <legend className="mb-3 text-[11px] font-medium tracking-[0.08em] text-[#9ca3af] uppercase">
          Application access
        </legend>
        <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
          {applicationRoles
            .filter((option) => availableRoles.includes(option.value))
            .map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 text-[#d1d5db]"
              >
                <input
                  name="role"
                  type="radio"
                  value={option.value}
                  checked={role === option.value}
                  onChange={(event) => setRole(event.target.value)}
                  className="size-4 accent-[#00e5a3]"
                />
                {option.label}
              </label>
            ))}
        </div>
      </fieldset>
      <p className="text-xs leading-5 text-[#9ca3af]">
        The person can sign in later; their access is bound to that verified email on
        first sign-in.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-[#f87171]">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className="h-11 rounded-xl bg-[#00e5a3] px-5 font-semibold text-[#0b1014] hover:bg-[#00c98f]"
      >
        {pending ? "Provisioning…" : "Provision access"}
      </Button>
    </form>
  );
}
