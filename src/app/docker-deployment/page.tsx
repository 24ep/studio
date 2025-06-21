// This page is no longer used and can be safely deleted.
// Keeping a minimal component to prevent build errors if still referenced unexpectedly,
// but the navigation links and title handling for it have been removed.
export default function DockerDeploymentPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-xl font-semibold">
        This page has been removed.
      </h1>
      <p className="text-muted-foreground">
        Docker setup information can be found in the project&apos;s README.md.
      </p>
    </div>
  );
}