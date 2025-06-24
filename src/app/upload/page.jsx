// This page is no longer used as resume uploads are handled
// via the modal on the Candidates page.
// It can be safely deleted.
// Keeping a minimal component to prevent build errors if still referenced somewhere unexpectedly.
export default function UploadPage() {
    return (<div className="container mx-auto py-8">
      <h1 className="text-xl font-semibold">
        Resume upload functionality has moved.
      </h1>
      <p className="text-muted-foreground">
        Please upload resumes for specific candidates via the Candidates page.
      </p>
    </div>);
}
