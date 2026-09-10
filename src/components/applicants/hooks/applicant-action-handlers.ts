import { toast } from "react-hot-toast";
import type { Applicant, ApplicantFilterValues, ApplicantStatus } from "@/lib/types";
import { getErrorMessage } from "@/lib/networkUtils";
import {
  appendApplicantToLists,
  createApplicantRecruiterRestorer,
  createApplicantRecruiterUpdater,
  createApplicantSourceRestorer,
  createApplicantSourceUpdater,
  createApplicantStatusUpdater,
  createOriginalApplicantRestorer,
  getRejectedApplicantMessage,
  getRecruiterAssignmentSuccessMessage,
  getSourceAssignmentSuccessMessage,
  postApplicantBulkAction,
  putApplicantUpdate,
  refreshApplicantList,
  removeApplicantFromLists,
  updateApplicantLists,
  type ApplicantListUpdater,
} from "./applicant-action-utils";

export interface ApplicantActionListSetters {
  setFilteredApplicants: ApplicantListUpdater;
  setAllApplicantsForCounts: ApplicantListUpdater;
}

export interface ApplicantActionRefreshOptions {
  fetchTableData: (filters: ApplicantFilterValues, page: number, pageSize: number) => void | Promise<void>;
  filters: ApplicantFilterValues;
  page: number;
  pageSize: number;
}

interface ApplicantActionContext {
  listSetters: ApplicantActionListSetters;
  refreshOptions: ApplicantActionRefreshOptions;
}

interface UpdateApplicantStatusActionOptions {
  applicantId: string;
  context: ApplicantActionContext;
  newStatus: ApplicantStatus;
  notes?: string;
  originalApplicant: Applicant;
  suppressToast?: boolean;
}

interface DeleteApplicantActionOptions {
  applicantId: string;
  context: ApplicantActionContext;
  originalApplicant: Applicant;
}

interface AssignRecruiterActionOptions {
  applicantId: string;
  context: ApplicantActionContext;
  originalApplicant: Applicant;
  recruiterId: string | null;
}

interface AssignSourceActionOptions {
  applicantId: string;
  context: ApplicantActionContext;
  originalApplicant: Applicant;
  sourceId: string | null;
}

export async function runUpdateApplicantStatusAction({
  applicantId,
  context,
  newStatus,
  notes,
  originalApplicant,
  suppressToast,
}: UpdateApplicantStatusActionOptions): Promise<void> {
  updateApplicantLists(context.listSetters, createApplicantStatusUpdater(applicantId, newStatus));

  if (!suppressToast) {
    toast.loading("Updating applicant status...", { id: applicantId });
  }

  try {
    const result = await postApplicantBulkAction(
      {
        action: "change_status",
        applicantIds: [applicantId],
        newStatus,
        transitionNotes: notes,
      },
      "Failed to update applicant status"
    );

    const rejectedApplicantMessage = getRejectedApplicantMessage(result, applicantId);
    if (rejectedApplicantMessage) {
      throw new Error(`Headcount constraint: ${rejectedApplicantMessage}`);
    }

    if (!suppressToast) {
      toast.success(`Status updated to ${newStatus}`, { id: applicantId });
    }

    refreshApplicantList(context.refreshOptions);
  } catch (error) {
    updateApplicantLists(context.listSetters, createOriginalApplicantRestorer(originalApplicant));

    if (!suppressToast) {
      toast.error(getErrorMessage(error), { id: applicantId });
    }
  }
}

export async function runDeleteApplicantAction({
  applicantId,
  context,
  originalApplicant,
}: DeleteApplicantActionOptions): Promise<void> {
  removeApplicantFromLists(context.listSetters, applicantId);
  toast.loading("Deleting applicant...", { id: applicantId });

  try {
    await postApplicantBulkAction(
      {
        action: "delete",
        applicantIds: [applicantId],
      },
      "Failed to delete applicant"
    );

    toast.success("Applicant deleted successfully", { id: applicantId });
    refreshApplicantList(context.refreshOptions);
  } catch (error) {
    appendApplicantToLists(context.listSetters, originalApplicant);
    toast.error(getErrorMessage(error), { id: applicantId });
  }
}

export async function runAssignRecruiterAction({
  applicantId,
  context,
  originalApplicant,
  recruiterId,
}: AssignRecruiterActionOptions): Promise<void> {
  const prevRecruiter = originalApplicant.recruiter || null;
  updateApplicantLists(context.listSetters, createApplicantRecruiterUpdater(applicantId, recruiterId));
  toast.loading("Assigning recruiter...", { id: applicantId });

  try {
    await postApplicantBulkAction(
      {
        action: "assign_recruiter",
        applicantIds: [applicantId],
        newRecruiterId: recruiterId,
      },
      "Failed to assign recruiter"
    );

    toast.success(getRecruiterAssignmentSuccessMessage(recruiterId), { id: applicantId });
    refreshApplicantList(context.refreshOptions);
  } catch (error) {
    updateApplicantLists(context.listSetters, createApplicantRecruiterRestorer(applicantId, prevRecruiter));
    toast.error(getErrorMessage(error), { id: applicantId });
  }
}

export async function runAssignSourceAction({
  applicantId,
  context,
  originalApplicant,
  sourceId,
}: AssignSourceActionOptions): Promise<void> {
  const prevSource = originalApplicant.source || null;
  updateApplicantLists(context.listSetters, createApplicantSourceUpdater(applicantId, sourceId));
  toast.loading("Assigning source...", { id: applicantId });

  try {
    await putApplicantUpdate(applicantId, { sourceId }, "Failed to assign source");

    toast.success(getSourceAssignmentSuccessMessage(sourceId), { id: applicantId });
    refreshApplicantList(context.refreshOptions);
  } catch (error) {
    updateApplicantLists(context.listSetters, createApplicantSourceRestorer(applicantId, prevSource));
    toast.error(getErrorMessage(error), { id: applicantId });
  }
}
