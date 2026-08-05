export const applicationRoles = [
  { value: "manager", label: "Manager" },
  { value: "intern", label: "Intern" },
  { value: "teammate", label: "Teammate / Mentor" },
  { value: "guest", label: "Guest" },
] as const;

export type ApplicationRole = (typeof applicationRoles)[number]["value"];

export const applicationRoleValues = applicationRoles.map((role) => role.value) as [
  ApplicationRole,
  ...ApplicationRole[],
];
