
// src/app/setup/page.tsx
// This page is no longer used and can be safely deleted.
// Keeping a minimal component to prevent build errors if still referenced unexpectedly,
// but the navigation links and title handling for it have been removed.
export default function SetupPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-xl font-semibold">
        This page has been removed.
      </h1>
      <p className="text-muted-foreground">
        Initial application setup is now primarily handled via Docker Compose and environment variables.
      </p>
    </div>
  );
}
