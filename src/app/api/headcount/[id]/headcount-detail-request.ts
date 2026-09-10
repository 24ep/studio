import type { HeadcountDetailRouteContext } from './headcount-detail-types';

export async function resolveHeadcountId(context: HeadcountDetailRouteContext) {
  const { id } = await context.params;
  return id;
}
