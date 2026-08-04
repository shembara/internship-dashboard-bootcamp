import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

export const applicationRoles = ["manager", "intern", "teammate"] as const;
export type ApplicationRole = (typeof applicationRoles)[number];

const identitySchema = z.object({
  provider: z.string().min(1),
  subject: z.string().min(1),
});

export const appUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  active: z.boolean(),
  roles: z.array(z.enum(applicationRoles)).min(1),
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
