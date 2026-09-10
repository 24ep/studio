export function ApiDocsErrorPanel({ error }: { error: string }) {
  return (
    <div className="p-6">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/60">
        <h2 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-200">API Documentation Error</h2>
        <p className="text-red-700 dark:text-red-300">Failed to load API documentation: {error}</p>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">Please try refreshing the page or contact support if the issue persists.</p>
      </div>
    </div>
  );
}

export function ApiDocsLoadingPanel() {
  return (
    <div className="p-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/60">
        <h2 className="mb-2 text-lg font-semibold text-blue-800 dark:text-blue-200">Loading API Documentation...</h2>
        <p className="text-blue-700 dark:text-blue-300">Please wait while we load the API documentation.</p>
      </div>
    </div>
  );
}
