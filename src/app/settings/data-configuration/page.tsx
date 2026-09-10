import { redirect } from "next/navigation";

import { getLegacyDataConfigurationRoute } from "./data-configuration-page-utils";

export default async function DataConfigurationPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section } = await searchParams;
  redirect(getLegacyDataConfigurationRoute(section));
}

