'use client';

import { ApiDocsPageView } from './ApiDocsPageView';
import { useApiDocsPage } from './use-api-docs-page';

export default function ApiDocsPage() {
  const page = useApiDocsPage();

  return (
    <ApiDocsPageView
      availableTags={page.availableTags}
      error={page.error}
      filteredSpec={page.filteredSpec}
      isLoading={!page.swaggerSpec}
      selectedTag={page.selectedTag}
      onSelectedTagChange={page.setSelectedTag}
    />
  );
}
