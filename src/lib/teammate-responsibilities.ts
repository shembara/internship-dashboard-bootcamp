export const teammateResponsibilities = [
  { value: "mentor", label: "Mentor" },
  { value: "projectManager", label: "Project manager" },
  { value: "teamLead", label: "Team lead" },
] as const;

export type TeammateResponsibility = (typeof teammateResponsibilities)[number]["value"];
