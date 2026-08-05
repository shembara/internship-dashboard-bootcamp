"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { ApplicationUserOption } from "@/lib/assignments/types";

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
      trigger={
        <Button
          type="button"
          className="h-10 rounded-xl bg-[#00e5a3] font-semibold text-[#0b1014] hover:bg-[#00c98f]"
        >
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
        />
      )}
    </Modal>
  );
}
