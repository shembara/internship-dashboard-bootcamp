import { redirect } from "next/navigation";

import { getAuthorizationContext } from "@/server/authorization/context";
import { getOptionalAuthenticatedUser } from "@/server/auth/require-user";

export default async function HomePage() {
  const user = await getOptionalAuthenticatedUser();
  if (!user) {
    redirect("/sign-in");
  }

  const context = await getAuthorizationContext(user);
  if (context.access !== "appUser") {
    redirect("/forbidden");
  }
  if (context.appUser.roles.includes("manager")) {
    redirect("/manager/internships");
  }
  if (context.appUser.roles.includes("intern")) {
    redirect("/intern");
  }
  if (context.appUser.roles.includes("teammate")) {
    redirect("/teammate");
  }

  redirect("/forbidden");
}
