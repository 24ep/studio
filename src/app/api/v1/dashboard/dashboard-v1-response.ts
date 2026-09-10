type CountValue = string | number | bigint | null | undefined;

type ApplicantStatsRow = {
  total?: CountValue;
  new?: CountValue;
  inProgress?: CountValue;
  hired?: CountValue;
  rejected?: CountValue;
};

type PositionStatsRow = {
  total?: CountValue;
  open?: CountValue;
  closed?: CountValue;
};

type ApplicationStatsRow = {
  total?: CountValue;
  thisMonth?: CountValue;
  lastMonth?: CountValue;
};

type RecruiterStatsRow = {
  total?: CountValue;
  active?: CountValue;
};

type RecentActivityRow = {
  id?: unknown;
  type?: unknown;
  message?: unknown;
  timestamp?: unknown;
  userId?: unknown;
  userName?: unknown;
};

export type DashboardV1ResponseData = {
  applicantStats?: ApplicantStatsRow;
  positionStats?: PositionStatsRow;
  applicationStats?: ApplicationStatsRow;
  recruiterStats?: RecruiterStatsRow;
  recentActivity: RecentActivityRow[];
};

function toInt(value: CountValue) {
  const parsed = Number.parseInt(String(value ?? '0'), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function serializeDashboardV1Data(data: DashboardV1ResponseData) {
  const { applicantStats, positionStats, applicationStats, recruiterStats, recentActivity } = data;

  return {
    Applicants: {
      total: toInt(applicantStats?.total),
      new: toInt(applicantStats?.new),
      inProgress: toInt(applicantStats?.inProgress),
      hired: toInt(applicantStats?.hired),
      rejected: toInt(applicantStats?.rejected),
    },
    positions: {
      total: toInt(positionStats?.total),
      open: toInt(positionStats?.open),
      closed: toInt(positionStats?.closed),
    },
    applications: {
      total: toInt(applicationStats?.total),
      thisMonth: toInt(applicationStats?.thisMonth),
      lastMonth: toInt(applicationStats?.lastMonth),
    },
    recruiters: {
      total: toInt(recruiterStats?.total),
      active: toInt(recruiterStats?.active),
    },
    recentActivity: recentActivity.map(row => ({
      id: row.id,
      type: row.type,
      message: row.message,
      timestamp: row.timestamp,
      userId: row.userId,
      userName: row.userName,
    })),
  };
}
