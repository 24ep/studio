export interface MeetingRoom {
  id: string;
  displayName: string;
  emailAddress: string;
  capacity: number | null;
  building: string | null;
  floorNumber: number | null;
  isWheelChairAccessible: boolean | null;
  address: {
    city: string | null;
    countryOrRegion: string | null;
    postalCode: string | null;
    state: string | null;
    street: string | null;
  } | null;
}

export interface RoomList {
  id: string;
  displayName: string;
  emailAddress: string;
}

export interface GraphMeetingRoomAddress {
  city?: string | null;
  countryOrRegion?: string | null;
  postalCode?: string | null;
  state?: string | null;
  street?: string | null;
}

export interface GraphMeetingRoom {
  id?: string;
  displayName?: string | null;
  nickname?: string | null;
  emailAddress?: string | null;
  mail?: string | null;
  capacity?: number | null;
  building?: string | null;
  floorNumber?: number | null;
  isWheelChairAccessible?: boolean | null;
  address?: GraphMeetingRoomAddress | null;
}

export interface GraphRoomList {
  id?: string;
  displayName?: string | null;
  emailAddress?: string | null;
}

export interface GraphConnectionTestResult {
  success: boolean;
  error?: string;
  roomCount?: number;
}
