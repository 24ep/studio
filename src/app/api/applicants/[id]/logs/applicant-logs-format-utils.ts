import type { Prisma } from '@prisma/client';

export type TransitionActivityRow = Prisma.TransitionRecordGetPayload<{
  include: {
    actingUser: true;
  };
}>;

export type ApplicantActivityAttachmentRow = Prisma.AttachmentGetPayload<{
  include: {
    uploadedBy: true;
  };
}> & { url?: string };

export type ApplicantImportActivityRow = Prisma.LogEntryGetPayload<{
  include: { actingUser: true };
}>;

export type ApplicantActivitySource = {
  id: string;
  applicationDate: Date;
  position: { title: string } | null;
};

export type RecruitmentStageRow = {
  id: string;
  name: string;
};

export type ApplicantActivityLog = {
  id: string;
  action: string;
  user: string;
  time: Date;
  note: string;
  stage?: string;
  attachments?: Array<{
    id: string;
    fileName: string;
    url: string;
    label: string;
    updatedAt: Date;
    filePath: string;
    applicantId?: string;
  }>;
};

export interface ApplicantLogsPagination {
  limit: number;
  offset: number;
}

export function createApplicantStageNameMap(stages: RecruitmentStageRow[]) {
  return new Map(stages.map((stage) => [stage.id, stage.name]));
}

function getStageName(stageIdToName: Map<string, string>, stageId: string) {
  return stageIdToName.get(stageId) || stageId;
}

export function getTransitionActivityNote({
  currentStage,
  notes,
  previousStage,
  stageIdToName,
}: {
  currentStage: string;
  notes?: string | null;
  previousStage?: string | null;
  stageIdToName: Map<string, string>;
}) {
  const currentStageName = getStageName(stageIdToName, currentStage);
  const previousStageName = previousStage ? getStageName(stageIdToName, previousStage) : null;
  const moveNote = previousStage && previousStage !== currentStage
    ? `Moved from ${previousStageName} to ${currentStageName} stage.`
    : `Entered ${currentStageName} stage.`;
  const trimmedNotes = notes?.trim();

  return trimmedNotes ? `${moveNote} Note: ${trimmedNotes}` : moveNote;
}

export function getTransitionActivityLogs(
  transitions: TransitionActivityRow[],
  stageIdToName: Map<string, string>,
): ApplicantActivityLog[] {
  return transitions.map((transition, index, rows) => ({
    id: transition.id,
    action: 'Stage changed',
    user: transition.actingUser?.name || 'System',
    time: transition.date,
    note: getTransitionActivityNote({
      currentStage: transition.stage,
      notes: transition.notes,
      previousStage: rows[index + 1]?.stage,
      stageIdToName,
    }),
    stage: transition.stage,
  }));
}

function findInitialAppliedTransition(
  transitions: TransitionActivityRow[],
  stageIdToName: Map<string, string>,
) {
  return [...transitions].reverse().find((transition) => (
    getStageName(stageIdToName, transition.stage).toLowerCase() === 'applied'
  ));
}

export function getApplicationActivityLog({
  applicant,
  attachments,
  transitions,
  stageIdToName,
}: {
  applicant: ApplicantActivitySource;
  attachments: ApplicantActivityAttachmentRow[];
  transitions: TransitionActivityRow[];
  stageIdToName: Map<string, string>;
}): ApplicantActivityLog {
  const initialAppliedTransition = findInitialAppliedTransition(transitions, stageIdToName);

  return {
    id: `application-${applicant.id}`,
    action: 'Applied',
    user: initialAppliedTransition?.actingUser?.name || attachments[0]?.uploadedBy?.name || 'System',
    time: applicant.applicationDate,
    note: applicant.position?.title
      ? `Applied for ${applicant.position.title}.`
      : 'Application submitted.',
    stage: initialAppliedTransition?.stage,
    attachments: attachments.map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      url: attachment.url || '',
      label: attachment.label,
      updatedAt: attachment.updatedAt,
      filePath: attachment.filePath,
      applicantId: attachment.applicantId || undefined,
    })),
  };
}

export function compareApplicantActivityLogsByNewest(a: ApplicantActivityLog, b: ApplicantActivityLog) {
  const dateA = new Date(a.time);
  const dateB = new Date(b.time);

  if (Number.isNaN(dateA.getTime()) || Number.isNaN(dateB.getTime())) {
    return 0;
  }

  return dateB.getTime() - dateA.getTime();
}

function formatImportedAttributeValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'blank';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function getApplicantImportActivityLogs(importLogs: ApplicantImportActivityRow[]): ApplicantActivityLog[] {
  return importLogs.map((entry) => {
    const details = entry.details && typeof entry.details === 'object' && !Array.isArray(entry.details)
      ? entry.details as Record<string, unknown>
      : {};
    const attributes = details.changedAttributes && typeof details.changedAttributes === 'object' && !Array.isArray(details.changedAttributes)
      ? details.changedAttributes as Record<string, unknown>
      : {};
    const changes = Object.entries(attributes).map(([attribute, rawChange]) => {
      const change = rawChange && typeof rawChange === 'object' && !Array.isArray(rawChange) ? rawChange as Record<string, unknown> : {};
      return `${attribute}: ${formatImportedAttributeValue(change.from)} → ${formatImportedAttributeValue(change.to)}`;
    });
    return {
      id: entry.id,
      action: String(details.action || '').includes('UPDATE') ? 'Updated by import' : 'Created by import',
      user: entry.actingUser?.name || 'System',
      time: entry.timestamp,
      note: changes.length ? changes.join('; ') : 'Applicant data was written by an import job.',
    };
  });
}

export function getApplicantActivityLogs({
  applicant,
  recruitmentStages,
  attachments,
  transitions,
  importLogs = [],
}: {
  applicant: ApplicantActivitySource;
  recruitmentStages: RecruitmentStageRow[];
  attachments: ApplicantActivityAttachmentRow[];
  transitions: TransitionActivityRow[];
  importLogs?: ApplicantImportActivityRow[];
}) {
  const stageIdToName = createApplicantStageNameMap(recruitmentStages);
  const initialAppliedTransition = findInitialAppliedTransition(transitions, stageIdToName);
  const remainingTransitions = initialAppliedTransition
    ? transitions.filter((transition) => transition.id !== initialAppliedTransition.id)
    : transitions;

  return [
    getApplicationActivityLog({ applicant, attachments, transitions, stageIdToName }),
    ...getTransitionActivityLogs(remainingTransitions, stageIdToName),
    ...getApplicantImportActivityLogs(importLogs),
  ].sort(compareApplicantActivityLogsByNewest);
}

export function getApplicantActivityLogsPage(logs: ApplicantActivityLog[], { limit, offset }: ApplicantLogsPagination) {
  return {
    data: logs.slice(offset, offset + limit),
    pagination: {
      limit,
      offset,
      hasMore: offset + limit < logs.length,
      total: logs.length,
    },
  };
}
