
import { ResumeUploadForm } from '@/components/upload/ResumeUploadForm';

export default function UploadPage() {
  return (
    <div className="container mx-auto py-8">
      {/* <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Upload New Resumes
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Add candidate resumes to CandiTrack for automatic parsing and matching.
        </p>
      </div> */}
      <ResumeUploadForm />
    </div>
  );
}
