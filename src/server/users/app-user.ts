import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

export const applicationRoleSchema = z.enum(["manager", "intern", "teammate"]);

export type ApplicationRole = z.infer<typeof applicationRoleSchema>;

export const appUserIdentitySchema = z.object({
  provider: z.enum(["firebase", "google"]),
  subject: z.string().min(1),
});

export const appUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  active: z.boolean(),
  roles: z.array(applicationRoleSchema).min(1),
  identityState: z.enum(["pending", "linked"]).default("linked"),
  identities: z.array(appUserIdentitySchema),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
});

export type AppUser = z.infer<typeof appUserSchema>;

export type AppUserRecord = {
  id: string;
  data: AppUser;
};
