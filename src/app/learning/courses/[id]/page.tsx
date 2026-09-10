import { CourseExperience } from './CourseExperience';
import { LearningAssignmentBlock } from './LearningAssignmentBlock';

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const courseId = (await params).id;
  return (
    <>
      <CourseExperience courseId={courseId} />
      <LearningAssignmentBlock courseId={courseId} />
    </>
  );
}
