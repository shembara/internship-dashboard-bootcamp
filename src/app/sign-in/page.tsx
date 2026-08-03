import { redirect } from "next/navigation";

import { SignInCard } from "@/features/auth/SignInCard";
import { getOptionalAuthenticatedUser } from "@/server/auth/require-user";

export const metadata = {
  title: "Sign in",
};

export default async function SignInPage() {
  if (await getOptionalAuthenticatedUser()) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-5 sm:p-8">
      <SignInCard />
    </main>
  );
}
