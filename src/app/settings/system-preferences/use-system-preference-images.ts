import { useCallback, useRef, type ChangeEvent, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'react-hot-toast';
import {
  getUploadImageUrl,
  shouldRevokeTrackedPreviewUrl,
  validateSystemPreferenceImageFile,
} from '@/components/settings/system-preferences/utils';
import { readJsonOrFallback } from '@/lib/response-json';

type NullableFileSetter = Dispatch<SetStateAction<File | null>>;
type NullableStringSetter = Dispatch<SetStateAction<string | null>>;

interface RemoveImageSelectionInput {
  shouldRemoveSaved: boolean;
  previewUrl: string | null;
  savedUrl: string | null;
  setSelectedFile: NullableFileSetter;
  setPreviewUrl: NullableStringSetter;
  setSavedUrl: NullableStringSetter;
  restoreSavedPreview?: boolean;
}

interface UseSystemPreferenceImagesInput {
  showError: (message: string) => void;
}

export function useSystemPreferenceImages({ showError }: UseSystemPreferenceImagesInput) {
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const cleanupObjectUrls = useCallback(() => {
    objectUrlsRef.current.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore errors when revoking URLs.
      }
    });
    objectUrlsRef.current.clear();
  }, []);

  const createTrackedObjectUrl = useCallback((file: File): string => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.add(url);
    return url;
  }, []);

  const revokeTrackedPreviewUrl = useCallback((previewUrl: string | null) => {
    if (shouldRevokeTrackedPreviewUrl(previewUrl, objectUrlsRef.current)) {
      URL.revokeObjectURL(previewUrl);
      objectUrlsRef.current.delete(previewUrl);
    }
  }, []);

  const uploadImage = useCallback(async (file: File, type: string, loadingMessage: string): Promise<string | null> => {
    const validation = validateSystemPreferenceImageFile(file);
    if (!validation.valid) {
      showError(validation.message);
      return null;
    }

    try {
      const loadingToast = toast.loading(loadingMessage);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', type);

      const uploadRes = await fetch('/api/upload-image', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const errorData = await readJsonOrFallback<{ error?: string }>(uploadRes, { error: 'Upload failed' });
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const uploadData = await uploadRes.json();
      const imageUrl = getUploadImageUrl(uploadData);

      if (!imageUrl) {
        throw new Error('No URL returned from upload');
      }

      toast.success('Image uploaded successfully', { id: loadingToast });
      return imageUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      showError(`Error uploading image: ${errorMessage}`);
      return null;
    }
  }, [showError]);

  const uploadAndStoreImage = useCallback(async (
    e: ChangeEvent<HTMLInputElement>,
    type: string,
    loadingMessage: string,
    setPreviewUrl: NullableStringSetter,
    setSavedUrl: NullableStringSetter,
    setSelectedFile?: NullableFileSetter
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file, type, loadingMessage);
    if (url) {
      setSelectedFile?.(null);
      setPreviewUrl(url);
      setSavedUrl(url);
    }
    e.target.value = '';
  }, [uploadImage]);

  const setTrackedImagePreview = useCallback((
    e: ChangeEvent<HTMLInputElement>,
    setSelectedFile: NullableFileSetter,
    setPreviewUrl: NullableStringSetter
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(createTrackedObjectUrl(file));
  }, [createTrackedObjectUrl]);

  const createUploadedImageChangeHandler = useCallback((
    type: string,
    loadingMessage: string,
    setPreviewUrl: NullableStringSetter,
    setSavedUrl: NullableStringSetter,
    setSelectedFile?: NullableFileSetter,
  ) => async (e: ChangeEvent<HTMLInputElement>) => {
    await uploadAndStoreImage(
      e,
      type,
      loadingMessage,
      setPreviewUrl,
      setSavedUrl,
      setSelectedFile
    );
  }, [uploadAndStoreImage]);

  const createTrackedImageChangeHandler = useCallback((
    setSelectedFile: NullableFileSetter,
    setPreviewUrl: NullableStringSetter,
  ) => (e: ChangeEvent<HTMLInputElement>) => {
    setTrackedImagePreview(e, setSelectedFile, setPreviewUrl);
  }, [setTrackedImagePreview]);

  const removeImageSelection = useCallback(({
    shouldRemoveSaved,
    previewUrl,
    savedUrl,
    setSelectedFile,
    setPreviewUrl,
    setSavedUrl,
    restoreSavedPreview = true,
  }: RemoveImageSelectionInput) => {
    setSelectedFile(null);
    revokeTrackedPreviewUrl(previewUrl);

    if (shouldRemoveSaved) {
      setSavedUrl(null);
      setPreviewUrl(null);
    } else if (restoreSavedPreview) {
      setPreviewUrl(savedUrl);
    }
  }, [revokeTrackedPreviewUrl]);

  const createImageRemovalHandler = useCallback((
    getState: () => Pick<RemoveImageSelectionInput, 'previewUrl' | 'savedUrl'>,
    setSelectedFile: NullableFileSetter,
    setPreviewUrl: NullableStringSetter,
    setSavedUrl: NullableStringSetter,
    options: Pick<RemoveImageSelectionInput, 'restoreSavedPreview'> = {},
  ) => (shouldRemoveSaved: boolean) => {
    const { previewUrl, savedUrl } = getState();
    removeImageSelection({
      shouldRemoveSaved,
      previewUrl,
      savedUrl,
      setSelectedFile,
      setPreviewUrl,
      setSavedUrl,
      ...options,
    });
  }, [removeImageSelection]);

  return {
    cleanupObjectUrls,
    createImageRemovalHandler,
    createTrackedImageChangeHandler,
    createUploadedImageChangeHandler,
    removeImageSelection,
    setTrackedImagePreview,
    uploadAndStoreImage,
  };
}
