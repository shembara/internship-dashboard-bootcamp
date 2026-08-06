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
      internItem(
        "task-broken-down-into-subtasks-before-starting",
        "Task independently broken down into subtasks/checklist before starting",
        "required",
      ),
      internItem(
        "unit-and-integration-tests-written",
        "Unit and integration tests written for own code",
        "required",
      ),
      internItem(
        "review-conducted-on-someone-elses-pr",
        "Review conducted on someone else's PR",
        "required",
      ),
      internItem(
        "bug-fixed-from-bug-report",
        "Fixed a bug from a bug report",
        "required",
      ),
      internItem(
        "task-estimate-compared-to-actual-time",
        "Gave an estimate for own task and compared it to actual time spent",
        "required",
      ),
      internItem(
        "sprint-planning-participated",
        "Actively participated in sprint planning",
        "required",
      ),
      internItem(
        "existing-code-improvement-proposed",
        "Proposed an improvement in existing code",
        "recommended",
      ),
      internItem(
        "product-decisions-observed-and-opinion-given",
        "Observed the team's decisions regarding the product and gave an informed opinion",
        "recommended",
      ),
      internItem(
        "feature-demo-given-to-team-and-client",
        "Gave a demo of own feature to the team and the client",
        "recommended",
      ),
    ],
  },
  {
    stage: "independentWork",
    items: [
      internItem(
        "task-carried-through-full-cycle-independently",
        "Took a task and carried it through the entire cycle (analysis → implementation → tests → review → deploy) independently",
        "required",
      ),
      internItem(
        "technical-proposal-or-decision-made",
        "At least one technical proposal/decision made",
        "required",
      ),
      internItem(
        "refinement-or-estimation-led-for-teammate",
        "Led refinement/estimation of a task for someone else on the team",
        "required",
      ),
      internItem(
        "production-issue-or-edge-case-fixed-independently",
        "Independently investigated and fixed a production issue/edge case",
        "required",
      ),
      internItem(
        "full-code-review-given-with-feedback",
        "Gave a full code review with constructive feedback",
        "required",
      ),
      internItem(
        "technical-decision-shared-with-team",
        "Shared with the team some interesting technical decision",
        "recommended",
      ),
      internItem(
        "internship-progress-self-review-analyzed",
        "Analyzed own progress over the internship (self-review draft)",
        "recommended",
      ),
      internItem(
        "mentor-feedback-given",
        "Gave feedback to the mentor — what helped, what was missing",
        "recommended",
      ),
    ],
  },
  {
    stage: "finalReview",
    items: [
      internItem(
        "completed-tasks-and-features-summary-prepared",
        "Summary of completed tasks and features prepared",
        "required",
      ),
      internItem(
        "self-assessment-form-submitted",
        "Self-assessment form submitted, covering: technical skills, ownership, communication, and collaboration (1 short rating + comment per area)",
        "required",
      ),
      mentorOrManagerItem(
        "mentor-and-team-feedback-collected",
        "Feedback collected from mentor and team",
        "required",
      ),
      internItem(
        "final-one-on-one-conversation-held",
        "Final 1:1 conversation held — strengths, growth areas, next steps discussed",
        "required",
      ),
      mentorOrManagerItem(
        "mentor-final-outcome-recommendation-submitted",
        "Mentor submits final outcome recommendation — one of: Extend contract / Convert to full offer / Conclude internship — with a short justification",
        "required",
      ),
      internItem(
        "personal-development-plan-drafted",
        "Draft a personal development plan for the next 3–6 months",
        "recommended",
      ),
      internItem(
        "three-month-journey-presentation-shared",
        "Prepare a short presentation of the 3-month journey and share with the team",
        "recommended",
      ),
      internItem(
        "internship-process-survey-completed",
        "Internship process survey completed (3–5 fixed questions: onboarding clarity, mentor support, task difficulty pacing)",
        "recommended",
      ),
      internItem(
        "team-thanked-and-contacts-exchanged",
        "Thank the team and exchange contacts for networking",
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
