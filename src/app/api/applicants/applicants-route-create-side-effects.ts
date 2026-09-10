import type { QueryResultRow } from "pg";

import { NotificationService } from "@/lib/notificationService";
import { syncRecruiterForApplicant } from "@/lib/recruiterSync";
import type { DbClient } from "@/lib/db";
import { dispatchWebhooks } from "@/lib/webhookDispatcher";

import { APPLICANT_WITH_RECRUITER_QUERY } from "./applicants-route-utils";

export type ApplicantCreatedRow = QueryResultRow & {
  id: string;
  name: string;
  recruiterId?: string | null;
  positionTitle?: string | null;
};

type ApplicantWithRecruiterRow = QueryResultRow & {
  recruiterId?: string | null;
  positionTitle?: string | null;
};

interface SyncRecruiterAndNotifyOptions {
  client: DbClient;
  applicantId: string;
  name: string;
  positionId: string | null | undefined;
  actingUserId: string;
  actingUserName: string;
  hasRecruiter: boolean;
}

export async function syncRecruiterAndNotify({
  client,
  applicantId,
  name,
  positionId,
  actingUserId,
  actingUserName,
  hasRecruiter,
}: SyncRecruiterAndNotifyOptions) {
  if (!positionId || hasRecruiter) {
    return;
  }

  try {
    const syncSuccess = await syncRecruiterForApplicant(
      applicantId,
      positionId,
      actingUserId,
      actingUserName
    );

    if (!syncSuccess) {
      return;
    }

    const updatedApplicantResult = await client.query<ApplicantWithRecruiterRow>(
      APPLICANT_WITH_RECRUITER_QUERY,
      [applicantId]
    );
    const updatedApplicant = updatedApplicantResult.rows[0];
    if (!updatedApplicant?.recruiterId) {
      return;
    }

    try {
      await NotificationService.notifyApplicantAdded(
        applicantId,
        name,
        positionId,
        updatedApplicant.positionTitle || "Unknown Position",
        updatedApplicant.recruiterId,
        actingUserId
      );
    } catch {
      // Preserve existing behavior: notification failures do not fail creation.
    }
  } catch {
    // Preserve existing behavior: recruiter sync failures do not fail creation.
  }
}

export async function dispatchApplicantCreatedWebhook(newApplicant: ApplicantCreatedRow) {
  try {
    await dispatchWebhooks.ApplicantCreated(newApplicant);
  } catch {
    // Preserve existing behavior: webhook failures do not fail creation.
  }
}
