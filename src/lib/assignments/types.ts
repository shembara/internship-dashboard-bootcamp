export type ApplicationUserOption = {
  id: string;
  displayName: string;
  email: string;
  identityState: "pending" | "linked";
};

export type TeamOption = {
  id: string;
  title: string;
};
