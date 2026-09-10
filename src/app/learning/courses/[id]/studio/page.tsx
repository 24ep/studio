import { CourseStudio } from './CourseStudio';
export default async function StudioPage({ params }: { params: Promise<{ id: string }> }) {
  return <CourseStudio courseId={(await params).id} />;
}
