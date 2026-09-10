import { describe, expect, it } from 'vitest';

import {
    getAzureMeetingRoomsTestToast,
    isAzureMeetingRoomsTestDisabled,
} from './azure-integration-tab-utils';

describe('azure integration tab utilities', () => {
    it('formats meeting room test toast messages', () => {
        expect(getAzureMeetingRoomsTestToast({ success: true, roomCount: 4 })).toEqual({
            type: 'success',
            message: 'Connection successful! Found 4 meeting rooms.',
        });
        expect(getAzureMeetingRoomsTestToast({ success: true })).toEqual({
            type: 'success',
            message: 'Connection successful! Found 0 meeting rooms.',
        });
        expect(getAzureMeetingRoomsTestToast({ success: false, error: 'No permission' })).toEqual({
            type: 'error',
            message: 'No permission',
        });
        expect(getAzureMeetingRoomsTestToast({ success: false })).toEqual({
            type: 'error',
            message: 'Connection test failed',
        });
    });

    it('disables meeting room tests while unavailable or busy', () => {
        expect(isAzureMeetingRoomsTestDisabled({
            azureMeetingRoomsEnabled: false,
            testingAzureRooms: false,
            isSaving: false,
        })).toBe(true);
        expect(isAzureMeetingRoomsTestDisabled({
            azureMeetingRoomsEnabled: true,
            testingAzureRooms: true,
            isSaving: false,
        })).toBe(true);
        expect(isAzureMeetingRoomsTestDisabled({
            azureMeetingRoomsEnabled: true,
            testingAzureRooms: false,
            isSaving: true,
        })).toBe(true);
        expect(isAzureMeetingRoomsTestDisabled({
            azureMeetingRoomsEnabled: true,
            testingAzureRooms: false,
            isSaving: false,
        })).toBe(false);
    });
});
