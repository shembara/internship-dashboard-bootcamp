import "server-only";

import { cache } from "react";

import type { AuthenticatedUser } from "@/server/auth/types";
import {
  findAppUserByFirebaseUid,
  linkPendingAppUser,
} from "@/server/repositories/app-users";
import type { AppUser } from "@/server/users/app-user";
import { recordFirestoreReadPath } from "@/server/firebase/read-diagnostics";

export type AuthorizationContext =
  | {
      access: "guest";
      user: AuthenticatedUser;
    }
  | {
      access: "disabled";
      user: AuthenticatedUser;
      userId: string;
      appUser: AppUser;
    }
  | {
      access: "appUser";
      user: AuthenticatedUser;
      userId: string;
      appUser: AppUser;
    };

const getAppUserRecordForAuthorization = cache(async function getAppUserRecord(
  firebaseUid: string,
  email: string,
) {
  recordFirestoreReadPath("authorization.app-user-resolution");
  const appUserRecord =
    (await findAppUserByFirebaseUid(firebaseUid)) ??
    (await linkPendingAppUser(firebaseUid, email));

  return appUserRecord;
});

export async function getAuthorizationContext(
  user: AuthenticatedUser,
): Promise<AuthorizationContext> {
  const appUserRecord = await getAppUserRecordForAuthorization(user.uid, user.email);

  if (!appUserRecord) {
    return {
      access: "guest",
      user,
    };
  }

  if (!appUserRecord.data.active) {
    return {
      access: "disabled",
      user,
      userId: appUserRecord.id,
      appUser: appUserRecord.data,
    };
  }

  return {
    access: "appUser",
    user,
    userId: appUserRecord.id,
    appUser: appUserRecord.data,
  };
}
