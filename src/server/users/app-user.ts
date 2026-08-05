import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import { applicationRoleValues } from "@/lib/users/roles";

export type { ApplicationRole } from "@/lib/users/roles";

const identitySchema = z.object({
  provider: z.string().min(1),
  subject: z.string().min(1),
});

export const appUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  active: z.boolean(),
  roles: z.array(z.enum(applicationRoleValues)).min(1),
  identityState: z.enum(["pending", "linked"]),
  identities: z.array(identitySchema).optional().default([]),
  createdAt: z
    .instanceof(Timestamp)
    .optional()
    .default(() => Timestamp.now()),
  updatedAt: z
    .instanceof(Timestamp)
    .optional()
    .default(() => Timestamp.now()),
});

export type AppUser = z.infer<typeof appUserSchema>;
