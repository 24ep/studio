import type {
  CompanyPortalBlock,
  CompanyPortalCmsCollection,
} from './company-portal-builder';

export type CompanyPortalMetric = {
  id: string;
  label: string;
  value: string;
};

export function getCompanyPortalMetrics(
  block: Pick<
    CompanyPortalBlock,
    'dataCollectionId' | 'metricLabelFieldKey' | 'metricValueFieldKey'
  >,
  collections: CompanyPortalCmsCollection[],
): CompanyPortalMetric[] {
  if (
    !block.dataCollectionId
    || !block.metricLabelFieldKey
    || !block.metricValueFieldKey
  ) {
    return [];
  }

  const collection = collections.find(item => item.id === block.dataCollectionId);
  if (!collection) return [];

  const labelFieldExists = collection.fields.some(
    field => field.key === block.metricLabelFieldKey,
  );
  const valueFieldExists = collection.fields.some(
    field => field.key === block.metricValueFieldKey,
  );
  if (!labelFieldExists || !valueFieldExists) return [];

  return collection.records.flatMap(record => {
    const label = String(record.values[block.metricLabelFieldKey] || '').trim();
    const value = String(record.values[block.metricValueFieldKey] || '').trim();

    return label && value
      ? [{ id: record.id, label, value }]
      : [];
  });
}
