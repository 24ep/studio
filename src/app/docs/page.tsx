export default function DocsPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4 text-foreground">Documentation</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 border border-border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-3 text-card-foreground">API Documentation</h2>
          <p className="text-muted-foreground mb-4">
            Interactive API documentation with Swagger UI for testing endpoints.
          </p>
          <a 
            href="/api-docs/ui" 
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            View API Documentation
          </a>
        </div>
        
        <div className="p-6 border border-border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-3 text-card-foreground">Settings API Docs</h2>
          <p className="text-muted-foreground mb-4">
            API documentation accessible from the settings panel with server selection.
          </p>
          <a 
            href="/settings/api-docs" 
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            View Settings API Docs
          </a>
        </div>
      </div>
    </div>
  );
}
