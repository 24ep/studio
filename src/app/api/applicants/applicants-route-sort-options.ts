const SORT_MAP: Record<string, string> = {
  name_ASC: 'c.name ASC',
  name_DESC: 'c.name DESC',
  email_ASC: 'c.email ASC',
  email_DESC: 'c.email DESC',
  fitScore_ASC: 'c."fitScore" ASC NULLS FIRST',
  fitScore_DESC: 'c."fitScore" DESC NULLS LAST',
  applicationDate_ASC: 'c."applicationDate" ASC',
  applicationDate_DESC: 'c."applicationDate" DESC',
  status_ASC: 'c."statusId" ASC',
  status_DESC: 'c."statusId" DESC',
  lastUpdate_ASC: 'c."updatedAt" ASC',
  lastUpdate_DESC: 'c."updatedAt" DESC',
  source_ASC: 'cs.name ASC',
  source_DESC: 'cs.name DESC',
  recruiter_ASC: 'u.name ASC',
  recruiter_DESC: 'u.name DESC',
  position_ASC: 'p.title ASC',
  position_DESC: 'p.title DESC',
  createdAt_ASC: 'c."createdAt" ASC',
  createdAt_DESC: 'c."createdAt" DESC',
  phone_ASC: 'c.phone ASC',
  phone_DESC: 'c.phone DESC',
};

export function buildApplicantRouteSortClause(searchParams: URLSearchParams) {
  const sortColumnParam = searchParams.get('sortColumn') || 'applicationDate';
  const sortDirectionParam = (searchParams.get('sortDirection') || 'DESC').toUpperCase();
  const dir = sortDirectionParam === 'ASC' ? 'ASC' : 'DESC';
  const sortKey = `${sortColumnParam}_${dir}`;
  const baseSortClause = SORT_MAP[sortKey] || SORT_MAP.applicationDate_DESC;

  return searchParams.get('showPinSection') === 'true'
    ? `c."isPinned" DESC, c."pinnedAt" DESC NULLS LAST, ${baseSortClause}`
    : baseSortClause;
}
