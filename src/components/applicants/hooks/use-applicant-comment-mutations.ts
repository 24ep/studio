import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';

import {
  addApplicantComment,
  deleteApplicantComment,
  updateApplicantComment,
} from '../applicant-comments-api';
import {
  createOptimisticApplicantComment,
  getCommentSubmitErrorMessage,
  getOriginalCommentId,
  type ApplicantCommentChannel,
  type ApplicantCommentItem,
} from '../applicant-comments-utils';

interface UseApplicantCommentMutationsOptions {
  applicantId: string;
  clearFiles: () => void;
  comments: ApplicantCommentItem[];
  files: File[];
  labels: string[];
  newComment: string;
  onCommentsChange: () => void;
  refreshFirstCommentsPage: () => Promise<void>;
  selectedChannel: ApplicantCommentChannel;
  setComments: Dispatch<SetStateAction<ApplicantCommentItem[]>>;
  setNewComment: (value: string) => void;
}

export function useApplicantCommentMutations({
  applicantId,
  clearFiles,
  comments,
  files,
  labels,
  newComment,
  onCommentsChange,
  refreshFirstCommentsPage,
  selectedChannel,
  setComments,
  setNewComment,
}: UseApplicantCommentMutationsOptions) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingSaving, setEditingSaving] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddComment = useCallback(async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (!newComment.trim() && files.length === 0) return;

    setSaving(true);
    setError(null);

    const optimisticComment = createOptimisticApplicantComment({
      content: newComment,
      channel: selectedChannel,
      files,
      labels,
    });

    setComments(prev => [optimisticComment, ...(Array.isArray(prev) ? prev : [])]);

    try {
      await addApplicantComment({
        applicantId,
        content: newComment,
        channel: selectedChannel,
        files,
        labels,
      });

      setNewComment('');
      clearFiles();
      await refreshFirstCommentsPage();
      onCommentsChange();
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(getCommentSubmitErrorMessage(err));
      setComments(prev => Array.isArray(prev) ? prev.filter(comment => comment.id !== optimisticComment.id) : []);
    } finally {
      setSaving(false);
    }
  }, [
    applicantId,
    clearFiles,
    files,
    labels,
    newComment,
    onCommentsChange,
    refreshFirstCommentsPage,
    selectedChannel,
    setComments,
    setNewComment,
  ]);

  const handleEditComment = useCallback(async (id: string) => {
    const originalId = getOriginalCommentId(id);

    setEditingSaving(id);
    setError(null);
    const prevComments = Array.isArray(comments) ? [...comments] : [];
    setComments(Array.isArray(comments) ? comments.map(comment => (
      comment.id === originalId ? { ...comment, content: editingContent } : comment
    )) : []);
    setEditingId(null);
    setEditingContent('');

    try {
      await updateApplicantComment({
        applicantId,
        commentId: originalId,
        content: editingContent,
      });

      await refreshFirstCommentsPage();
      onCommentsChange();
    } catch {
      setComments(prevComments);
      setError('Failed to update comment');
    } finally {
      setEditingSaving(null);
    }
  }, [
    applicantId,
    comments,
    editingContent,
    onCommentsChange,
    refreshFirstCommentsPage,
    setComments,
  ]);

  const handleDeleteComment = useCallback(async (id: string) => {
    const originalId = getOriginalCommentId(id);

    setDeleteLoading(id);
    setError(null);
    const prevComments = Array.isArray(comments) ? [...comments] : [];
    setComments(Array.isArray(comments) ? comments.filter(comment => comment.id !== originalId) : []);

    try {
      await deleteApplicantComment({
        applicantId,
        commentId: originalId,
      });

      await refreshFirstCommentsPage();
      onCommentsChange();
    } catch {
      setComments(prevComments);
      setError('Failed to delete comment');
    } finally {
      setDeleteLoading(null);
    }
  }, [
    applicantId,
    comments,
    onCommentsChange,
    refreshFirstCommentsPage,
    setComments,
  ]);

  const handleStartEdit = useCallback((itemId: string, content: string) => {
    setEditingId(itemId);
    setEditingContent(content);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingContent('');
  }, []);

  return {
    deleteLoading,
    editingContent,
    editingId,
    editingSaving,
    error,
    handleAddComment,
    handleCancelEdit,
    handleDeleteComment,
    handleEditComment,
    handleStartEdit,
    saving,
    setEditingContent,
  };
}
