import { TASKBOARD_PAGE_SIZE, type TaskboardApplicantFilters, type TaskboardPagination } from './taskboard-applicants-types';

export function parseTaskboardApplicantRequest(url: string): {
  filters: TaskboardApplicantFilters;
  pagination: TaskboardPagination;
} {
  const { searchParams } = new URL(url);
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10));
  const requestedLimit = Number.parseInt(searchParams.get('limit') || TASKBOARD_PAGE_SIZE.toString(), 10);
  const limit = Math.max(1, requestedLimit);

  return {
    pagination: {
      page,
      limit,
      offset: (page - 1) * limit,
    },
    filters: {
      name: searchParams.get('name'),
      positionId: searchParams.get('positionId'),
      status: searchParams.get('status'),
      recruiterId: searchParams.get('recruiterId'),
      minFitScore: searchParams.get('minFitScore'),
      maxFitScore: searchParams.get('maxFitScore'),
      applicationDateStart: searchParams.get('applicationDateStart'),
      applicationDateEnd: searchParams.get('applicationDateEnd'),
      assignmentStatus: searchParams.get('assignmentStatus'),
      positionStatus: searchParams.get('positionStatus'),
      scoreStatus: searchParams.get('scoreStatus'),
    },
  };
}
