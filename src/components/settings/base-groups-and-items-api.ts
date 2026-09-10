import type { BaseGroup, BaseItem } from './BaseGroupsAndItemsParts';
import type { BaseItemFormState } from './base-groups-and-items-utils';
import {
  createSortOrderUpdateRequest,
  fetchBaseCollection,
  mutateBaseResource,
} from './base-groups-and-items-api-core';

type GroupFormState = {
  name: string;
  description: string;
};

type SortOrderUpdate = {
  id: string;
  sortOrder: number;
};

type BaseItemSavePayload = Omit<BaseItemFormState, 'groupId'> & {
  groupId: string | null;
};

export function fetchBaseGroups(endpoint: string, groupTitle: string) {
  return fetchBaseCollection<BaseGroup>({
    endpoint,
    errorMessage: `Failed to fetch ${groupTitle.toLowerCase()}`,
    logMessage: `Error fetching ${groupTitle.toLowerCase()}:`,
    showToast: true,
  });
}

export function fetchBaseItems(endpoint: string, itemTitle: string) {
  return fetchBaseCollection<BaseItem>({
    endpoint,
    errorMessage: `Failed to fetch ${itemTitle.toLowerCase()}`,
    logMessage: `Error fetching ${itemTitle.toLowerCase()}:`,
  });
}

export function createBaseGroup(
  endpoint: string,
  groupTitle: string,
  formData: GroupFormState
) {
  return mutateBaseResource({
    body: formData,
    fallbackMessage: `Failed to create ${groupTitle.toLowerCase()}`,
    logMessage: `Error creating ${groupTitle.toLowerCase()}:`,
    method: 'POST',
    successMessage: `${groupTitle} created successfully`,
    url: endpoint,
  });
}

export function updateBaseGroup(
  endpoint: string,
  groupTitle: string,
  groupId: string,
  formData: GroupFormState
) {
  return mutateBaseResource({
    body: formData,
    fallbackMessage: `Failed to update ${groupTitle.toLowerCase()}`,
    logMessage: `Error updating ${groupTitle.toLowerCase()}:`,
    method: 'PUT',
    successMessage: `${groupTitle} updated successfully`,
    url: `${endpoint}/${groupId}`,
  });
}

export function deleteBaseGroup(
  endpoint: string,
  groupTitle: string,
  groupId: string
) {
  return mutateBaseResource({
    fallbackMessage: `Failed to delete ${groupTitle.toLowerCase()}`,
    logMessage: `Error deleting ${groupTitle.toLowerCase()}:`,
    method: 'DELETE',
    successMessage: `${groupTitle} deleted successfully`,
    url: `${endpoint}/${groupId}`,
  });
}

export function createBaseItem(
  endpoint: string,
  itemTitle: string,
  payload: BaseItemSavePayload
) {
  return mutateBaseResource({
    body: payload,
    fallbackMessage: `Failed to create ${itemTitle.toLowerCase()}`,
    logMessage: `Error creating ${itemTitle.toLowerCase()}:`,
    method: 'POST',
    successMessage: `${itemTitle} created successfully`,
    url: endpoint,
  });
}

export function updateBaseItem(
  endpoint: string,
  itemTitle: string,
  itemId: string,
  payload: Partial<BaseItemSavePayload>
) {
  return mutateBaseResource({
    body: payload,
    fallbackMessage: `Failed to update ${itemTitle.toLowerCase()}`,
    logMessage: `Error updating ${itemTitle.toLowerCase()}:`,
    method: 'PUT',
    successMessage: `${itemTitle} updated successfully`,
    url: `${endpoint}/${itemId}`,
  });
}

export function deleteBaseItem(
  endpoint: string,
  itemTitle: string,
  itemId: string
) {
  return mutateBaseResource({
    fallbackMessage: `Failed to delete ${itemTitle.toLowerCase()}`,
    logMessage: `Error deleting ${itemTitle.toLowerCase()}:`,
    method: 'DELETE',
    successMessage: `${itemTitle} deleted successfully`,
    url: `${endpoint}/${itemId}`,
  });
}

export function updateBaseItemStatus(
  endpoint: string,
  itemTitle: string,
  itemId: string,
  isActive: boolean
) {
  return mutateBaseResource({
    body: { isActive: !isActive },
    fallbackMessage: `Failed to update ${itemTitle.toLowerCase()} status`,
    logMessage: `Error updating ${itemTitle.toLowerCase()} status:`,
    method: 'PUT',
    successMessage: `${itemTitle} ${!isActive ? 'activated' : 'deactivated'} successfully`,
    url: `${endpoint}/${itemId}`,
  });
}

export function addBaseItemToGroup(
  endpoint: string,
  itemTitle: string,
  itemId: string,
  groupId: string | null
) {
  return mutateBaseResource({
    body: { groupId },
    fallbackMessage: `Failed to add ${itemTitle.toLowerCase()} to group`,
    logMessage: `Error adding ${itemTitle.toLowerCase()} to group:`,
    method: 'PUT',
    successMessage: `${itemTitle} updated successfully`,
    url: `${endpoint}/${itemId}`,
  });
}

export function removeBaseItemFromGroup(
  endpoint: string,
  itemTitle: string,
  itemId: string
) {
  return mutateBaseResource({
    body: { groupId: null },
    fallbackMessage: `Failed to remove ${itemTitle.toLowerCase()} from group`,
    logMessage: `Error removing ${itemTitle.toLowerCase()} from group:`,
    method: 'PUT',
    successMessage: `${itemTitle} removed from group successfully`,
    url: `${endpoint}/${itemId}`,
  });
}

export async function saveBaseSortOrder(endpoint: string, updates: SortOrderUpdate[]) {
  await Promise.all(
    updates.map((update) =>
      createSortOrderUpdateRequest(endpoint, update.id, update.sortOrder)
    )
  );
}
