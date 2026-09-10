-- SQL Script to remove orphaned "Warning System" permissions from the database

-- 1. Remove from UserGroup module permissions
UPDATE "UserGroup" 
SET permissions = array_remove(array_remove(permissions, 'WARNING_CONFIGURATIONS_VIEW'), 'WARNING_CONFIGURATIONS_MANAGE')
WHERE permissions @> ARRAY['WARNING_CONFIGURATIONS_VIEW']::varchar[] 
   OR permissions @> ARRAY['WARNING_CONFIGURATIONS_MANAGE']::varchar[];

-- 2. Remove from individual User module permissions
UPDATE "User"
SET module_permissions = array_remove(array_remove(module_permissions, 'WARNING_CONFIGURATIONS_VIEW'), 'WARNING_CONFIGURATIONS_MANAGE')
WHERE module_permissions @> ARRAY['WARNING_CONFIGURATIONS_VIEW']::varchar[] 
   OR module_permissions @> ARRAY['WARNING_CONFIGURATIONS_MANAGE']::varchar[];
