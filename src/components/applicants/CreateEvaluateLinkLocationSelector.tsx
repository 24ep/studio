"use client";

import {
  MapPinIcon as MapPin,
} from '@heroicons/react/24/outline';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AzureMeetingRoom } from './create-evaluate-link-utils';

export interface CreateEvaluateLinkLocationSelectorProps {
  azureMeetingRoomsEnabled: boolean;
  azureRooms: AzureMeetingRoom[];
  hasMatchingRoom: boolean;
  isCustomLocation: boolean;
  location: string;
  matchingAzureRooms: AzureMeetingRoom[];
  onCustomLocationChange: (isCustom: boolean) => void;
  onLocationChange: (location: string) => void;
  onLocationEmailChange: (email: string | undefined) => void;
}

export function CreateEvaluateLinkLocationSelector({
  azureMeetingRoomsEnabled,
  azureRooms,
  hasMatchingRoom,
  isCustomLocation,
  location,
  matchingAzureRooms,
  onCustomLocationChange,
  onLocationChange,
  onLocationEmailChange,
}: CreateEvaluateLinkLocationSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <MapPin className="h-4 w-4" /> Location
      </Label>
      <div className="relative group">
        <Input
          placeholder={azureMeetingRoomsEnabled ? 'Search rooms or type custom location' : 'Conference Room A, Zoom link, etc.'}
          value={location}
          onChange={(event) => {
            onLocationChange(event.target.value);
            onLocationEmailChange(undefined);
            onCustomLocationChange(true);
          }}
          onFocus={() => onCustomLocationChange(true)}
          onBlur={() => setTimeout(() => onCustomLocationChange(false), 200)}
        />

        {azureMeetingRoomsEnabled && isCustomLocation && (
          <CreateEvaluateLinkRoomDropdown
            azureRooms={azureRooms}
            hasMatchingRoom={hasMatchingRoom}
            location={location}
            matchingAzureRooms={matchingAzureRooms}
            onCustomLocationChange={onCustomLocationChange}
            onLocationChange={onLocationChange}
            onLocationEmailChange={onLocationEmailChange}
          />
        )}
      </div>
    </div>
  );
}

function CreateEvaluateLinkRoomDropdown({
  azureRooms,
  hasMatchingRoom,
  location,
  matchingAzureRooms,
  onCustomLocationChange,
  onLocationChange,
  onLocationEmailChange,
}: Pick<
  CreateEvaluateLinkLocationSelectorProps,
  | 'azureRooms'
  | 'hasMatchingRoom'
  | 'location'
  | 'matchingAzureRooms'
  | 'onCustomLocationChange'
  | 'onLocationChange'
  | 'onLocationEmailChange'
>) {
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground border rounded-md shadow-md z-50 max-h-[200px] overflow-y-auto">
      {matchingAzureRooms.map((room) => (
        <button
          type="button"
          key={room.id}
          className="w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground flex flex-col"
          onClick={() => {
            onLocationChange(room.displayName);
            onLocationEmailChange(room.emailAddress);
            onCustomLocationChange(false);
          }}
          onMouseDown={(event) => event.preventDefault()}
        >
          <span className="font-medium">{room.displayName}</span>
          <div className="flex gap-2 text-xs text-muted-foreground">
            {room.capacity && <span>Capacity: {room.capacity}</span>}
            {room.building && <span>- {room.building}</span>}
          </div>
        </button>
      ))}

      {azureRooms.length > 0 && !hasMatchingRoom && location && (
        <div className="px-3 py-2 text-sm text-muted-foreground italic">
          No matching rooms found. Using custom location.
        </div>
      )}
    </div>
  );
}
