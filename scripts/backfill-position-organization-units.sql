-- Idempotently link legacy positions where the department name identifies one active department.
WITH unique_departments AS (
  SELECT lower(trim(name)) AS normalized_name, MIN(id::text)::uuid AS id
  FROM hr_departments
  WHERE unit_type = 'department' AND is_active = true
  GROUP BY lower(trim(name))
  HAVING COUNT(*) = 1
)
UPDATE "Position" position
SET organization_unit_id = department.id,
    "updatedAt" = CURRENT_TIMESTAMP
FROM unique_departments department
WHERE position.organization_unit_id IS NULL
  AND lower(trim(position.department)) = department.normalized_name;

-- Deployment logs capture this result as the correction report for unresolved positions.
SELECT position.id, position.title, position.department,
       CASE
         WHEN COUNT(department.id) = 0 THEN 'unmatched'
         ELSE 'ambiguous'
       END AS resolution_status
FROM "Position" position
LEFT JOIN hr_departments department
  ON lower(trim(department.name)) = lower(trim(position.department))
 AND department.unit_type = 'department'
 AND department.is_active = true
WHERE position.organization_unit_id IS NULL
GROUP BY position.id, position.title, position.department
ORDER BY position.department, position.title;
