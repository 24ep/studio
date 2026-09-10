export type ApplicantResumesRouteContext = {
  params: Promise<{ id: string }>;
};

export type ResumePagination = {
  limit: number;
  offset: number;
};
