import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { HeadcountRequestsClient } from "./HeadcountRequestsClient";

export default async function HeadcountRequestsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!hasPermission(session.user, "POSITIONS_VIEW")) {
    redirect("/unauthorized");
  }

  return <HeadcountRequestsClient />;
}
