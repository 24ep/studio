import {
  DEFAULT_APPLICANT_EVALUATION_PROMPT,
  DEFAULT_JOB_DESCRIPTION_PROMPT,
} from './ai-prompts-defaults';
import {
  AiPromptCard,
  EvaluationPromptHelp,
  JobDescriptionPromptHelp,
} from './AiPromptsTabParts';

interface AiPromptsTabProps {
  jobDescriptionSystemPrompt: string;
  setJobDescriptionSystemPrompt: (value: string) => void;
  applicantEvaluationCriteriaPrompt: string;
  setApplicantEvaluationCriteriaPrompt: (value: string) => void;
  isSaving: boolean;
}

export default function AiPromptsTab({
  jobDescriptionSystemPrompt,
  setJobDescriptionSystemPrompt,
  applicantEvaluationCriteriaPrompt,
  setApplicantEvaluationCriteriaPrompt,
  isSaving
}: AiPromptsTabProps) {

  const handleResetJobDescription = () => {
    if (confirm('Are you sure you want to reset the prompt to the default system value?')) {
      setJobDescriptionSystemPrompt(DEFAULT_JOB_DESCRIPTION_PROMPT);
    }
  };

  const handleResetEvaluationCriteria = () => {
    if (confirm('Are you sure you want to reset the evaluation prompt to the default system value?')) {
      setApplicantEvaluationCriteriaPrompt(DEFAULT_APPLICANT_EVALUATION_PROMPT);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 p-6 overflow-y-auto">
      <AiPromptCard
        id="jd-prompt"
        title="Job Description Generation"
        description="Customize the instructions sent to the AI when generating job descriptions."
        value={jobDescriptionSystemPrompt}
        onChange={setJobDescriptionSystemPrompt}
        onReset={handleResetJobDescription}
        disabled={isSaving}
        minHeightClass="min-h-[300px]"
      >
        <JobDescriptionPromptHelp />
      </AiPromptCard>
      
      <AiPromptCard
        id="evaluation-prompt"
        title="Applicant Evaluation Criteria"
        description="Customize the instructions used when AI summarizes Applicant evaluation results."
        value={applicantEvaluationCriteriaPrompt}
        onChange={setApplicantEvaluationCriteriaPrompt}
        onReset={handleResetEvaluationCriteria}
        disabled={isSaving}
        minHeightClass="min-h-[260px]"
      >
        <EvaluationPromptHelp />
      </AiPromptCard>
    </div>
  );
}
