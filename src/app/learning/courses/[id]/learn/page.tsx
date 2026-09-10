import { CourseExperience } from '../CourseExperience';
export default async function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  return <CourseExperience courseId={(await params).id} player />;
}
