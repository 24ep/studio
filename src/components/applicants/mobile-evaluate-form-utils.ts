export type MobileEvaluateAnimationState = 'idle' | 'exiting' | 'entering';
export type MobileEvaluateDirection = 'next' | 'prev';

export const MOBILE_EVALUATE_SCORE_OPTIONS = [
  { value: 1, label: 'Unsatisfactory', color: 'bg-[#E84040]', borderColor: 'border-[#E84040]' },
  { value: 2, label: 'Needs Improvement', color: 'bg-[#F4A340]', borderColor: 'border-[#F4A340]' },
  { value: 3, label: 'Meets Expectations', color: 'bg-[#F1D24A]', borderColor: 'border-[#F1D24A]' },
  { value: 4, label: 'Exceeds Expectations', color: 'bg-[#63E25F]', borderColor: 'border-[#63E25F]' },
  { value: 5, label: 'Exceptional', color: 'bg-[#2E7D32]', borderColor: 'border-[#2E7D32]' },
];

export function getMobileEvaluateProgressLabel({
  currentQuestionIndex,
  questionCount,
  isCommentsView,
}: {
  currentQuestionIndex: number;
  questionCount: number;
  isCommentsView: boolean;
}) {
  return isCommentsView
    ? `Comments (${questionCount + 1}/${questionCount + 1})`
    : `Question ${currentQuestionIndex + 1} of ${questionCount}`;
}

export function getMobileEvaluateAnimationClassName(
  animationState: MobileEvaluateAnimationState,
  direction: MobileEvaluateDirection,
) {
  if (animationState === 'idle') {
    return 'opacity-100 translate-x-0';
  }

  if (animationState === 'exiting') {
    return direction === 'next'
      ? 'opacity-0 -translate-x-8'
      : 'opacity-0 translate-x-8';
  }

  return direction === 'next'
    ? 'opacity-0 translate-x-8'
    : 'opacity-0 -translate-x-8';
}
