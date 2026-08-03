import { type InternshipStage } from "@/lib/internships/types";

export const checklistCompletionActors = ["intern", "mentor", "manager"] as const;

export type ChecklistCompletionActor = (typeof checklistCompletionActors)[number];
export type ChecklistItemType = "required" | "recommended";

export type StageChecklistItemTemplate = {
  key: string;
  label: string;
  type: ChecklistItemType;
  allowedCompletionActors: readonly ChecklistCompletionActor[];
};

export type StageChecklistTemplate = {
  stage: InternshipStage;
  items: readonly StageChecklistItemTemplate[];
};

const internItem = (
  key: string,
  label: string,
  type: ChecklistItemType,
): StageChecklistItemTemplate => ({
  key,
  label,
  type,
  allowedCompletionActors: ["intern", "mentor", "manager"],
});

const mentorOrManagerItem = (
  key: string,
  label: string,
  type: ChecklistItemType,
): StageChecklistItemTemplate => ({
  key,
  label,
  type,
  allowedCompletionActors: ["mentor", "manager"],
});

export const stageChecklistTemplates = [
  {
    stage: "onboarding",
    items: [
      internItem(
        "accounts-and-tools-configured",
        "Required accounts and tools configured",
        "required",
      ),
      mentorOrManagerItem(
        "project-repository-access-received",
        "Project repository access received",
        "required",
      ),
      internItem("jira-access-received", "Jira access received", "required"),
      internItem("slack-channels-joined", "Relevant Slack channels joined", "required"),
      internItem(
        "local-project-launched",
        "Local project successfully launched",
        "required",
      ),
      mentorOrManagerItem(
        "development-environment-verified",
        "Development environment verified with mentor",
        "required",
      ),
      internItem(
        "mentor-one-on-one-scheduled",
        "Recurring 1:1 with mentor scheduled",
        "required",
      ),
      internItem(
        "introductory-meetings-completed",
        "Introductory meetings with teammates completed",
        "required",
      ),
      internItem(
        "team-ceremonies-added",
        "Team ceremonies added to calendar",
        "required",
      ),
      internItem(
        "project-documentation-reviewed",
        "Project documentation reviewed",
        "required",
      ),
      internItem(
        "product-purpose-reviewed",
        "Product purpose and main workflows reviewed",
        "required",
      ),
      internItem(
        "architecture-overview-reviewed",
        "Architecture overview reviewed",
        "required",
      ),
      internItem(
        "development-pr-workflow-reviewed",
        "Development and pull request workflow reviewed",
        "required",
      ),
      internItem(
        "testing-expectations-discussed",
        "Testing expectations discussed",
        "required",
      ),
      internItem("first-jira-task-selected", "First Jira task selected", "required"),
      internItem(
        "first-task-expectations-discussed",
        "First task expectations discussed with mentor",
        "required",
      ),
      internItem(
        "read-merged-pull-requests",
        "Read recently merged pull requests",
        "recommended",
      ),
      internItem(
        "unfamiliar-terms-noted",
        "Write down unfamiliar project terms",
        "recommended",
      ),
      internItem(
        "mentor-questions-prepared",
        "Prepare questions for mentor 1:1",
        "recommended",
      ),
      internItem(
        "area-owners-learned",
        "Learn who owns the main areas of the project",
        "recommended",
      ),
      internItem(
        "team-discussions-followed",
        "Follow relevant team discussions",
        "recommended",
      ),
      internItem("feedback-requested-early", "Ask for feedback early", "recommended"),
    ],
  },
  {
    stage: "firstJiraTasks",
    items: [
      internItem(
        "first-task-requirements-reviewed",
        "First task requirements reviewed",
        "required",
      ),
      internItem(
        "ambiguities-clarified-before-implementation",
        "Ambiguities clarified before implementation",
        "required",
      ),
      internItem(
        "implementation-approach-discussed",
        "Implementation approach discussed",
        "required",
      ),
      internItem(
        "first-implementation-completed",
        "First implementation completed",
        "required",
      ),
      internItem("first-pull-request-opened", "First pull request opened", "required"),
      internItem(
        "pull-request-description-complete",
        "Pull request description includes context and testing information",
        "required",
      ),
      mentorOrManagerItem("code-review-received", "Code review received", "required"),
      internItem("review-comments-addressed", "Review comments addressed", "required"),
      mentorOrManagerItem(
        "first-pull-request-merged",
        "First pull request merged",
        "required",
      ),
      internItem("first-jira-task-completed", "First Jira task completed", "required"),
      internItem(
        "task-learnings-discussed",
        "Task learnings discussed with mentor",
        "required",
      ),
      internItem(
        "first-task-lessons-documented",
        "Document the main lessons from the first task",
        "recommended",
      ),
      internItem(
        "another-merged-pull-request-reviewed",
        "Review another recently merged pull request",
        "recommended",
      ),
      internItem(
        "next-task-questions-prepared",
        "Prepare questions before starting the next task",
        "recommended",
      ),
    ],
  },
  {
    stage: "activeContribution",
    items: [
      mentorOrManagerItem(
        "multiple-team-tasks-completed",
        "Completed multiple team tasks",
        "required",
      ),
      internItem(
        "team-ceremonies-participated",
        "Participates in regular team ceremonies",
        "required",
      ),
      internItem(
        "progress-communicated-clearly",
        "Communicates progress clearly",
        "required",
      ),
      internItem(
        "unclear-requirements-clarified",
        "Clarifies unclear requirements before implementation",
        "required",
      ),
      internItem(
        "review-feedback-responded",
        "Responds to review feedback",
        "required",
      ),
      mentorOrManagerItem(
        "official-feedback-cycle-published",
        "Confirm the first formal feedback cycle is coordinated in the Feedback App",
        "recommended",
      ),
      internItem(
        "project-learning-shared",
        "Share a useful project learning with the team",
        "recommended",
      ),
      internItem(
        "feedback-requested-before-task-end",
        "Ask for feedback before completing a task",
        "recommended",
      ),
      internItem(
        "improvement-area-identified",
        "Identify one personal improvement area",
        "recommended",
      ),
    ],
  },
  {
    stage: "independentWork",
    items: [
      internItem(
        "medium-task-owned",
        "Independently owns a medium-sized task",
        "required",
      ),
      internItem(
        "implementation-steps-broken-down",
        "Breaks work into clear implementation steps",
        "required",
      ),
      internItem(
        "implementation-approach-proposed",
        "Proposes an implementation approach",
        "required",
      ),
      internItem(
        "relevant-edge-cases-identified",
        "Identifies relevant edge cases",
        "required",
      ),
      internItem(
        "delays-and-dependencies-communicated",
        "Communicates delays and dependencies early",
        "required",
      ),
      mentorOrManagerItem(
        "reduced-mentor-guidance-demonstrated",
        "Demonstrates reduced need for direct mentor guidance",
        "required",
      ),
      internItem(
        "supports-another-contributor",
        "Supports another intern or teammate when appropriate",
        "required",
      ),
      internItem(
        "completed-work-presented",
        "Present completed work to the team",
        "recommended",
      ),
      internItem(
        "pull-request-reviewed-with-mentor",
        "Review another contributor’s pull request with mentor support",
        "recommended",
      ),
      internItem(
        "process-improvement-suggested",
        "Suggest one project or process improvement",
        "recommended",
      ),
    ],
  },
  {
    stage: "finalReview",
    items: [
      internItem(
        "final-intern-reflection-submitted",
        "Final intern reflection submitted",
        "required",
      ),
      mentorOrManagerItem(
        "mentor-summary-completed",
        "Mentor summary completed",
        "required",
      ),
      mentorOrManagerItem(
        "final-feedback-cycle-started",
        "Confirm the final formal feedback cycle is coordinated in the Feedback App",
        "recommended",
      ),
      mentorOrManagerItem(
        "required-teammate-feedback-collected",
        "Confirm required teammate feedback has been collected in the Feedback App",
        "recommended",
      ),
      mentorOrManagerItem(
        "final-feedback-published",
        "Confirm final feedback has been published in the Feedback App",
        "recommended",
      ),
      internItem("final-one-on-one-completed", "Final 1:1 completed", "required"),
      mentorOrManagerItem(
        "internship-outcome-recorded",
        "Internship outcome recorded",
        "required",
      ),
      internItem(
        "advice-for-future-interns-documented",
        "Document advice for future interns",
        "recommended",
      ),
      internItem(
        "internship-learnings-shared",
        "Share internship learnings with the team",
        "recommended",
      ),
      internItem(
        "unfinished-work-handed-over",
        "Complete handover of unfinished work",
        "recommended",
      ),
    ],
  },
] as const satisfies readonly StageChecklistTemplate[];

export function getStageChecklistTemplate(
  stage: InternshipStage,
): StageChecklistTemplate {
  const template = stageChecklistTemplates.find(
    (candidate) => candidate.stage === stage,
  );

  if (!template) {
    throw new Error(`Missing checklist template for ${stage}.`);
  }

  return template;
}
