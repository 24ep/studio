export interface HeaderUserSummary {
  id: string;
  name: string;
  email?: string;
  role: string;
  avatarUrl: string | null;
  image: string | null;
  personalColor: string | null;
}

export interface HeaderPreviewUserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
}
