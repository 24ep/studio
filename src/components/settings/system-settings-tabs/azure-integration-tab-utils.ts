import type { AzureMeetingRoomsTestResult } from './azure-integration-tab-types';

export function getAzureMeetingRoomsTestToast(result: AzureMeetingRoomsTestResult) {
    if (result.success) {
        return {
            type: 'success' as const,
            message: `Connection successful! Found ${result.roomCount ?? 0} meeting rooms.`,
        };
    }

    return {
        type: 'error' as const,
        message: result.error || 'Connection test failed',
    };
}

export function isAzureMeetingRoomsTestDisabled({
    azureMeetingRoomsEnabled,
    testingAzureRooms,
    isSaving,
}: {
    azureMeetingRoomsEnabled: boolean;
    testingAzureRooms: boolean;
    isSaving: boolean;
}) {
    return !azureMeetingRoomsEnabled || testingAzureRooms || isSaving;
}
