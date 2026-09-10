import { broadcastApplicantUpdateIfChanged } from "./data-change-tracker";
import type { EventPayload, TrackedRecord } from "./realtime-event-types";
import {
  broadcastDashboardRefresh,
  broadcastHighPriorityAction,
  forceBroadcastAction,
} from "./simple-broadcaster-dashboard";

export function broadcastApplicantUpdate(
  applicant: TrackedRecord & { id?: string | number },
  actingUserId?: string,
) {
  broadcastApplicantUpdateIfChanged(applicant, actingUserId);
  broadcastDashboardRefresh("Applicant_updated");
}

export function broadcastApplicantCreated(applicant: EventPayload, actingUserId?: string) {
  broadcastHighPriorityAction("Applicant_update", {
    applicant,
    actingUserId,
    action: "created",
  });
  broadcastDashboardRefresh("Applicant_created");
}

export function broadcastApplicantDeleted(applicantId: string, actingUserId?: string) {
  broadcastHighPriorityAction("Applicant_update", {
    applicantId,
    actingUserId,
    action: "deleted",
  });
  broadcastDashboardRefresh("Applicant_deleted");
}

export function broadcastApplicantStatusChanged(
  applicant: EventPayload,
  oldStatus: string,
  newStatus: string,
  actingUserId?: string,
) {
  forceBroadcastAction("Applicant_update", {
    applicant,
    actingUserId,
    action: "status_changed",
    oldStatus,
    newStatus,
  });
  broadcastDashboardRefresh("Applicant_status_changed");
}
