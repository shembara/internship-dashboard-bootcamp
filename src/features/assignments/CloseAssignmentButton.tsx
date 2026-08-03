"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";

export function CloseAssignmentButton({
  internshipId,
  assignmentId,
  requiresConfirmation = false,
  onSuccess,
}: {
  internshipId: string;
  assignmentId: string;
  requiresConfirmation?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  function close() {
    if (
      requiresConfirmation &&
      !window.confirm(
        "End this mentor assignment? The teammate will immediately lose mentor permissions for this internship.",
      )
    ) {
      return;
    }
    setPending(true);
    return fetch(
      `/api/manager/internships/${internshipId}/teammate-assignments/${assignmentId}/close`,
      { method: "POST" },
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not end assignment.");
        }
        onSuccess?.();
        router.refresh();
      })
      .finally(() => setPending(false));
  }
  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={close}
      disabled={pending}
    >
      {pending ? "Ending…" : "End assignment"}
    </Button>
  );
}
