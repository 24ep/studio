import { toast } from "react-hot-toast";

import {
  runCategoryTreeMutation,
  type RunCategoryTreeMutationOptions,
} from "./categories-tree-mutation-api";

interface RunCategoryTreeMutationWithFeedbackOptions {
  consoleMessage: string;
  failureMessage: string;
  mutation: RunCategoryTreeMutationOptions;
  onSuccess: () => void;
  successMessage: string;
}

export async function runCategoryTreeMutationWithFeedback({
  consoleMessage,
  failureMessage,
  mutation,
  onSuccess,
  successMessage,
}: RunCategoryTreeMutationWithFeedbackOptions) {
  try {
    const result = await runCategoryTreeMutation(mutation);

    if (result.ok) {
      toast.success(successMessage);
      onSuccess();
      return;
    }

    toast.error(result.message);
  } catch (error) {
    console.error(consoleMessage, error);
    toast.error(failureMessage);
  }
}
