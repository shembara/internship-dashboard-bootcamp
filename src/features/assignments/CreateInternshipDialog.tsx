"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { ApplicationUserOption } from "@/lib/assignments/types";
import { managerTheme } from "@/lib/manager-workspace/theme";
import { cn } from "@/lib/utils";

import { CreateInternshipForm } from "./CreateInternshipForm";

export function CreateInternshipDialog({
  interns,
  teammates,
}: {
  interns: ApplicationUserOption[];
  teammates: ApplicationUserOption[];
}) {
  return (
    <Modal
      variant="dark"
      trigger={
        <Button type="button" className={cn(managerTheme.primaryButton, "h-10 gap-2 px-4")}>
          <Plus data-icon="inline-start" /> Create internship
        </Button>
      }
      title="Create internship"
      description="Select an available intern and their first Team Placement."
    >
      {(close) => (
        <CreateInternshipForm
          interns={interns}
          teammates={teammates}
          onSuccess={close}
          variant="dark"
        />
      )}
    </Modal>
  );
}
