"use client";

import { Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { ApplicationUserOption } from "@/lib/assignments/types";
import { CloseAssignmentButton } from "./CloseAssignmentButton";
import { EditResponsibilitiesForm } from "./EditResponsibilitiesForm";
import { TeamPlacementForm } from "./TeamPlacementForm";
import { TeammateAssignmentForm } from "./TeammateAssignmentForm";

export function AssignmentActions({
  internshipId,
  teamId,
  teamTitle,
  teammates,
}: {
  internshipId: string;
  teamId: string;
  teamTitle: string;
  teammates: ApplicationUserOption[];
}) {
  return (
    <div className="flex gap-2">
      <Modal
        trigger={
          <Button type="button" variant="outline" size="sm">
            <Pencil data-icon="inline-start" /> Edit Team
          </Button>
        }
        title="Change Team Placement"
        description="Changing Team ends the current placement and its active assignments."
      >
        {(close) => <TeamPlacementForm internshipId={internshipId} onSuccess={close} />}
      </Modal>
      <Modal
        trigger={
          <Button type="button" size="sm">
            <Plus data-icon="inline-start" /> Add teammate
          </Button>
        }
        title="Assign teammate"
        description={`Assign a teammate to ${teamTitle}.`}
      >
        {(close) => (
          <TeammateAssignmentForm
            internshipId={internshipId}
            teamId={teamId}
            teammates={teammates}
            onSuccess={close}
          />
        )}
      </Modal>
    </div>
  );
}

export function TeammateAssignmentActions({
  internshipId,
  assignmentId,
  responsibilities,
}: {
  internshipId: string;
  assignmentId: string;
  responsibilities: string[];
}) {
  return (
    <Modal
      trigger={
        <Button type="button" variant="outline" size="sm" aria-label="Edit assignment">
          <Pencil />
        </Button>
      }
      title="Edit teammate assignment"
      description="Update responsibilities or close this assignment."
    >
      {(close) => (
        <div className="space-y-5">
          <EditResponsibilitiesForm
            key={`${assignmentId}:${responsibilities.join(",")}`}
            internshipId={internshipId}
            assignmentId={assignmentId}
            selected={responsibilities}
            onSuccess={close}
          />
          <div className="border-t pt-4">
            <CloseAssignmentButton
              internshipId={internshipId}
              assignmentId={assignmentId}
              requiresConfirmation={responsibilities.includes("mentor")}
              onSuccess={close}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
