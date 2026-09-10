import type {
  PlatformModule,
  PlatformModuleCategory,
  PlatformModuleId,
} from "@/lib/types";

export interface RolePermissionSelectorProps {
  selectedPermissions: PlatformModuleId[];
  onPermissionsChange: (permissions: PlatformModuleId[]) => void;
  title?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  noCard?: boolean;
  protectedPermissions?: PlatformModuleId[];
  isLoading?: boolean;
}

export interface PermissionGroup {
  category: PlatformModuleCategory;
  permissions: PlatformModule[];
}

export interface RolePermissionSelectorActions {
  clearAllPermissions: () => void;
  clearCategoryPermissions: (category: string) => void;
  selectAllPermissions: () => void;
  selectCategoryPermissions: (category: string) => void;
  setSearchQuery: (query: string) => void;
  togglePermission: (permissionId: PlatformModuleId) => void;
}
