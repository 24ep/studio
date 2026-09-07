export interface BranchConfigItem {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  phone: string;
  manager: string;
  latitude: number | null;
  longitude: number | null;
  geofenceRadiusKm: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface BranchConfigResponse {
  branches?: BranchConfigItem[];
  message?: string;
}

export interface LocationSearchResult {
  id: string;
  displayName: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

export type BranchSaveStatus =
  | 'idle'
  | 'pending'
  | 'saving'
  | 'saved'
  | 'invalid'
  | 'error';

export const emptyBranch = (): BranchConfigItem => ({
  id: crypto.randomUUID(),
  name: '',
  code: '',
  address: '',
  city: '',
  country: '',
  timezone: 'Asia/Bangkok',
  phone: '',
  manager: '',
  latitude: null,
  longitude: null,
  geofenceRadiusKm: 0.5,
  isDefault: false,
  isActive: true,
});

export const starterBranches: BranchConfigItem[] = [
  {
    id: 'branch-bkk-hq',
    name: 'Bangkok HQ',
    code: 'BKK-HQ',
    address: '',
    city: 'Bangkok',
    country: 'Thailand',
    timezone: 'Asia/Bangkok',
    phone: '',
    manager: '',
    latitude: null,
    longitude: null,
    geofenceRadiusKm: 0.5,
    isDefault: true,
    isActive: true,
  },
];
