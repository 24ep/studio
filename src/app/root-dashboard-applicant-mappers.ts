import { safeJsonParse } from '@/lib/utils';
import type { Applicant } from '@/lib/types';

import {
  normalizeFitScore,
  toIsoString,
} from './root-dashboard-date-score-utils';
import type { DashboardApplicantRow } from './root-dashboard-initial-types';

const EMPTY_PARSED_APPLICANT_DATA: Applicant['parsedData'] = {
  personal_info: { firstname: '', lastname: '' },
  contact_info: { email: '' },
};

function mapDashboardApplicantPosition(row: DashboardApplicantRow) {
  return row.positionId ? {
    id: row.positionId,
    title: row.positionTitle || '',
    department: row.positionDepartment || '',
    positionLevel: row.positionLevel,
    isOpen: row.positionIsOpen || false,
  } : null;
}

function mapDashboardApplicantRecruiter(row: DashboardApplicantRow) {
  return row.recruiterId ? {
    id: row.recruiterId,
    name: row.recruiterName || '',
    email: row.recruiterEmail || '',
    avatarUrl: row.recruiterAvatarUrl || null,
  } : null;
}

export function mapDashboardApplicantRows(rows: DashboardApplicantRow[]) {
  return rows.map((row) => {
    const parsedData = safeJsonParse<Applicant['parsedData']>(
      row.parsedData,
      EMPTY_PARSED_APPLICANT_DATA
    );

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || null,
      avatarUrl: row.avatarUrl || null,
      dataAiHint: row.dataAiHint || null,
      resumePath: row.resumePath || null,
      parsedData,
      customAttributes: safeJsonParse(row.customAttributes, {}),
      positionId: row.positionId || null,
      position: mapDashboardApplicantPosition(row),
      fitScore: normalizeFitScore(row.fitScore, parsedData),
      statusId: row.statusId || '',
      status: row.status || 'Unknown',
      applicationDate: toIsoString(row.applicationDate),
      recruiterId: row.recruiterId || null,
      recruiter: mapDashboardApplicantRecruiter(row),
      createdAt: toIsoString(row.createdAt),
      updatedAt: toIsoString(row.updatedAt),
      transitionHistory: row.transitionHistory || [],
    };
  });
}
