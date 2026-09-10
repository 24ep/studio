import type { UpdateHeadcountRequest } from '@/lib/types';

export type HeadcountDetailRouteContext = {
  params: Promise<{ id: string }>;
};

export type HeadcountDetailSessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export type HeadcountActionBody = {
  action?: string;
};

export type HeadcountUpdateBody = UpdateHeadcountRequest;
