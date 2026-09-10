export interface AzureIntegrationTabProps {
    azureAdClientId: string;
    setAzureAdClientId: (val: string) => void;
    azureAdClientSecret: string;
    setAzureAdClientSecret: (val: string) => void;
    azureAdTenantId: string;
    setAzureAdTenantId: (val: string) => void;
    azureMeetingRoomsEnabled: boolean;
    setAzureMeetingRoomsEnabled: (val: boolean) => void;
    showAzureSecret: boolean;
    setShowAzureSecret: (val: boolean) => void;
    testingAzureRooms: boolean;
    setTestingAzureRooms: (val: boolean) => void;
    isSaving: boolean;
}

export interface AzureMeetingRoomsTestResult {
    success?: boolean;
    roomCount?: number;
    error?: string;
}
