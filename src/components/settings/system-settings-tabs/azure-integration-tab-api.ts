import type { AzureMeetingRoomsTestResult } from './azure-integration-tab-types';
import { readJsonOrFallback } from '../../../lib/response-json';

export async function testAzureMeetingRoomsConnection(fetcher: typeof fetch = fetch): Promise<AzureMeetingRoomsTestResult> {
    const response = await fetcher('/api/azure/meeting-rooms?test=true');
    return readJsonOrFallback<AzureMeetingRoomsTestResult>(response, {});
}
