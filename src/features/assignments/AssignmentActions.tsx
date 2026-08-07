"use client";

import { Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { ApplicationUserOption } from "@/lib/assignments/types";
import {
  type WorkspaceVariant,
  workspaceStyles,
} from "@/lib/manager-workspace/theme";
import { cn } from "@/lib/utils";
import { CloseAssignmentButton } from "./CloseAssignmentButton";
import { EditResponsibilitiesForm } from "./EditResponsibilitiesForm";
import { TeamPlacementForm } from "./TeamPlacementForm";
import { TeammateAssignmentForm } from "./TeammateAssignmentForm";

export function AssignmentActions({
  internshipId,
  teamId,
  teamTitle,
  teammates,
  variant = "default",
}: {
  internshipId: string;
  teamId: string;
  teamTitle: string;
  teammates: ApplicationUserOption[];
  variant?: WorkspaceVariant;
}) {
  const styles = workspaceStyles(variant);
  const modalVariant = variant === "dark" ? "dark" : undefined;

  return (
    <div className="flex gap-2">
      <Modal
        variant={modalVariant}
        trigger={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={styles.outlineButton}
          >
            <Pencil data-icon="inline-start" /> Edit Team
          </Button>
        }
        title="Change Team Placement"
        description="Changing Team ends the current placement and its active assignments."
      >
        {(close) => (
          <TeamPlacementForm
            internshipId={internshipId}
            onSuccess={close}
            variant={variant}
          />
        )}
      </Modal>
      <Modal
        variant={modalVariant}
        trigger={
          <Button type="button" size="sm" className={styles.primaryButton}>
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
            variant={variant}
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
  variant = "default",
}: {
  internshipId: string;
  assignmentId: string;
  responsibilities: string[];
  variant?: WorkspaceVariant;
}) {
  const styles = workspaceStyles(variant);
  const modalVariant = variant === "dark" ? "dark" : undefined;

  return (
    <Modal
      variant={modalVariant}
      trigger={
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Edit assignment"
          className={styles.outlineButton}
        >
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
            variant={variant}
          />
          <div className={cn("border-t pt-4", variant === "dark" && "border-white/10")}>
            <CloseAssignmentButton
              internshipId={internshipId}
              assignmentId={assignmentId}
              requiresConfirmation={responsibilities.includes("mentor")}
              onSuccess={close}
              variant={variant}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
