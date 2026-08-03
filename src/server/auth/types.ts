export type AuthenticatedUser = {
  uid: string;
  email: string;
  displayName?: string;
  emailVerified: boolean;
};
