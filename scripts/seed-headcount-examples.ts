import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

type ExampleRequest = {
  memoId: string;
  position: {
    title: string;
    department: string;
    positionLevel: string;
    description: string;
  };
  type: 'new' | 'replace' | 'promote';
  status: 'draft' | 'in_review' | 'vacant' | 'filled' | 'rejected';
  requestDate: Date;
  onboardingDate?: Date;
  notes: string;
  customFields: Prisma.InputJsonObject;
};

const examples: ExampleRequest[] = [
  {
    memoId: 'DEMO-HC-ENG-2026-01',
    position: {
      title: 'Senior Backend Engineer',
      department: 'Engineering',
      positionLevel: 'Senior',
      description: 'Build and operate reliable services for the HR platform.',
    },
    type: 'new',
    status: 'in_review',
    requestDate: new Date('2026-08-04T02:30:00.000Z'),
    onboardingDate: new Date('2026-10-01T00:00:00.000Z'),
    notes: 'Additional capacity for the employee data platform roadmap.',
    customFields: {
      priority: 'critical',
      businessJustification: 'Required to deliver the Q4 platform reliability and integration roadmap.',
      requestedByName: 'Maya Chen',
    },
  },
  {
    memoId: 'DEMO-HC-PEOPLE-2026-01',
    position: {
      title: 'People Operations Specialist',
      department: 'People',
      positionLevel: 'Mid',
      description: 'Support employee operations, onboarding, and HR service delivery.',
    },
    type: 'replace',
    status: 'in_review',
    requestDate: new Date('2026-08-06T04:15:00.000Z'),
    onboardingDate: new Date('2026-09-15T00:00:00.000Z'),
    notes: 'Backfill for the People Operations team.',
    customFields: {
      priority: 'urgent',
      businessJustification: 'Maintain onboarding service levels during the upcoming hiring cycle.',
      requestedByName: 'Daniel Wong',
    },
  },
  {
    memoId: 'DEMO-HC-PRODUCT-2026-01',
    position: {
      title: 'Product Designer',
      department: 'Product',
      positionLevel: 'Mid',
      description: 'Design clear, accessible workflows across the HR product suite.',
    },
    type: 'new',
    status: 'vacant',
    requestDate: new Date('2026-07-22T03:00:00.000Z'),
    onboardingDate: new Date('2026-09-01T00:00:00.000Z'),
    notes: 'Approved role for the employee experience product area.',
    customFields: {
      priority: 'normal',
      businessJustification: 'Expand design coverage for employee self-service and mobile workflows.',
      requestedByName: 'Nina Patel',
      approvalAction: 'approve',
      approvalActionByName: 'Admin User',
      approvalActionAt: '2026-07-24T08:20:00.000Z',
    },
  },
  {
    memoId: 'DEMO-HC-DATA-2026-01',
    position: {
      title: 'People Data Analyst',
      department: 'Analytics',
      positionLevel: 'Mid',
      description: 'Create trusted workforce reporting and decision-ready insights.',
    },
    type: 'new',
    status: 'vacant',
    requestDate: new Date('2026-07-18T06:45:00.000Z'),
    onboardingDate: new Date('2026-09-21T00:00:00.000Z'),
    notes: 'Approved analytics capacity for workforce planning.',
    customFields: {
      priority: 'urgent',
      businessJustification: 'Provide dedicated ownership of workforce metrics and planning models.',
      requestedByName: 'Sarah Connor',
      approvalAction: 'approve',
      approvalActionByName: 'Admin User',
      approvalActionAt: '2026-07-20T09:10:00.000Z',
    },
  },
  {
    memoId: 'DEMO-HC-ENG-2026-02',
    position: {
      title: 'DevOps Engineer',
      department: 'Engineering',
      positionLevel: 'Senior',
      description: 'Improve deployment reliability, observability, and platform security.',
    },
    type: 'replace',
    status: 'filled',
    requestDate: new Date('2026-06-11T02:10:00.000Z'),
    onboardingDate: new Date('2026-08-03T00:00:00.000Z'),
    notes: 'Role filled and onboarding completed.',
    customFields: {
      priority: 'normal',
      businessJustification: 'Replace a departing platform engineer and retain on-call coverage.',
      requestedByName: 'Maya Chen',
      approvalAction: 'approve',
      approvalActionByName: 'Admin User',
      approvalActionAt: '2026-06-13T05:40:00.000Z',
    },
  },
  {
    memoId: 'DEMO-HC-MKT-2026-01',
    position: {
      title: 'Employer Brand Specialist',
      department: 'Marketing',
      positionLevel: 'Mid',
      description: 'Strengthen employer brand campaigns and candidate communications.',
    },
    type: 'new',
    status: 'rejected',
    requestDate: new Date('2026-06-26T07:00:00.000Z'),
    notes: 'Request closed after budget review.',
    customFields: {
      priority: 'normal',
      businessJustification: 'Build a dedicated employer brand content and campaign capability.',
      requestedByName: 'Priya Shah',
      approvalAction: 'reject',
      approvalActionByName: 'Admin User',
      approvalActionAt: '2026-06-30T04:25:00.000Z',
      rejectionReason: 'Deferred to the next workforce planning cycle.',
    },
  },
];

async function ensurePosition(example: ExampleRequest['position']) {
  const positionSelect = {
    id: true,
    title: true,
    department: true,
    positionLevel: true,
  } as const;

  const existing = await prisma.position.findFirst({
    where: {
      title: { equals: example.title, mode: 'insensitive' },
    },
    select: positionSelect,
  });

  if (existing) return { position: existing, created: false };

  const position = await prisma.position.create({
    data: {
      ...example,
      isOpen: true,
      matchCriteria: 'Relevant role experience, strong collaboration, and clear communication.',
      customAttributes: {
        seededExample: true,
        seedSource: 'headcount-request-examples',
      },
    },
    select: positionSelect,
  });

  return { position, created: true };
}

async function main() {
  let createdPositions = 0;
  let createdRequests = 0;
  let skippedRequests = 0;

  for (const [index, example] of examples.entries()) {
    const { position, created } = await ensurePosition(example.position);
    if (created) createdPositions += 1;

    const enhancements = getSeedWorkflowFields(example, index);

    const existing = await prisma.headcount.findFirst({
      where: { memoId: example.memoId },
      select: { id: true, customFields: true },
    });

    if (existing) {
      const existingFields = existing.customFields && typeof existing.customFields === 'object' && !Array.isArray(existing.customFields)
        ? existing.customFields as Prisma.JsonObject
        : {};
      await prisma.headcount.update({
        where: { id: existing.id },
        data: { customFields: { ...existingFields, ...enhancements } },
        select: { id: true },
      });
      skippedRequests += 1;
      continue;
    }

    await prisma.headcount.create({
      data: {
        positionId: position.id,
        type: example.type,
        status: example.status,
        requestDate: example.requestDate,
        onboardingDate: example.onboardingDate,
        notes: example.notes,
        memoId: example.memoId,
        customFields: { ...example.customFields, ...enhancements },
      },
      select: { id: true },
    });
    createdRequests += 1;
  }

  const total = await prisma.headcount.count({
    where: { memoId: { startsWith: 'DEMO-HC-' } },
  });
  const statusCounts = await prisma.headcount.groupBy({
    by: ['status'],
    where: { memoId: { startsWith: 'DEMO-HC-' } },
    _count: { _all: true },
  });

  console.log(
    JSON.stringify(
      {
        createdPositions,
        createdRequests,
        skippedRequests,
        totalExampleRequests: total,
        statusCounts: Object.fromEntries(
          statusCounts.map(({ status, _count }) => [status, _count._all]),
        ),
      },
      null,
      2,
    ),
  );
}

function getSeedWorkflowFields(example: ExampleRequest, index: number): Prisma.InputJsonObject {
  const roleCounts = [3, 1, 2, 1, 1, 1];
  const annualCosts = [3_600_000, 840_000, 2_100_000, 780_000, 1_400_000, 720_000];
  const requesterTitles = ['Engineering Manager', 'Head of People', 'Product Manager', 'Data Manager', 'Engineering Manager', 'Marketing Manager'];
  const requestedByName = typeof example.customFields.requestedByName === 'string'
    ? example.customFields.requestedByName
    : 'Request owner';
  const complete = ['vacant', 'filled', 'rejected'].includes(example.status);
  const needsFinance = annualCosts[index] >= 1_000_000 || example.customFields.priority === 'critical';
  const approvalPath: Prisma.InputJsonArray = [
    { role: 'Requester', name: requestedByName, title: requesterTitles[index], status: 'complete' },
    { role: 'Department lead', name: `${example.position.department} lead`, title: 'Business approval', status: complete ? 'complete' : 'in_review' },
    ...(needsFinance ? [{ role: 'Finance', name: 'Finance approver', title: 'Budget approval', status: complete ? 'complete' : 'pending' }] : []),
    { role: 'HR', name: 'HR approver', title: 'Workforce approval', status: complete ? 'complete' : 'pending' },
  ];

  return {
    roleCount: roleCounts[index],
    annualCost: annualCosts[index],
    currency: 'THB',
    requesterTitle: requesterTitles[index],
    approvalPath,
  };
}

main()
  .catch((error) => {
    console.error('Failed to seed headcount request examples:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
