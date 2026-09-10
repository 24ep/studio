import type { ChangeEventHandler, Ref } from 'react';
import { Camera, ImageUp, Loader2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { UserAvatar } from './user-avatar';
import type { ProfileImageUploadUser } from './profile-image-upload-utils';
import { useProfileImageUpload } from './use-profile-image-upload';

interface ProfileImageUploadProps {
  user: ProfileImageUploadUser;
  onImageUpload: (imageUrl: string) => Promise<void>;
  onImageRemove: () => Promise<void>;
  className?: string;
  disabled?: boolean;
}

export function ProfileImageUpload({
  user,
  onImageUpload,
  onImageRemove,
  className,
  disabled = false,
}: ProfileImageUploadProps) {
  const upload = useProfileImageUpload({
    onImageRemove,
    onImageUpload,
    user,
  });

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-4">
        <UserAvatar
          user={{
            ...user,
            avatarUrl: upload.displayImageUrl || undefined,
          }}
          forceRefresh={upload.forceRefresh}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ProfileImageUploadButton
              disabled={disabled || upload.isUploading}
              hasImage={upload.hasImage}
              icon="camera"
              isUploading={upload.isUploading}
              labelWhenEmpty="Upload Photo"
              labelWhenFilled="Change Photo"
              onClick={() => upload.fileInputRef.current?.click()}
            />

            {upload.hasImage && (
              <ProfileImageRemoveButton
                disabled={disabled || upload.isRemoving}
                isRemoving={upload.isRemoving}
                onClick={upload.handleRemove}
              />
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            JPG, PNG or GIF. Max size 500MB.
          </p>
        </div>
      </div>

      <ProfileImageFileInput
        disabled={disabled}
        inputRef={upload.fileInputRef}
        onFileSelect={upload.handleFileSelect}
      />
    </div>
  );
}

export function ProfileImageUploadCompact({
  user,
  onImageUpload,
  onImageRemove,
  className,
  disabled = false,
}: ProfileImageUploadProps) {
  const upload = useProfileImageUpload({
    onImageRemove,
    onImageUpload,
    user,
  });

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <UserAvatar
        user={{
          ...user,
          avatarUrl: upload.displayImageUrl || undefined,
        }}
        size="lg"
        forceRefresh={upload.forceRefresh}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <ProfileImageUploadButton
            disabled={disabled || upload.isUploading}
            hasImage={upload.hasImage}
            icon="image"
            isUploading={upload.isUploading}
            labelWhenEmpty="Upload"
            labelWhenFilled="Change"
            onClick={() => upload.fileInputRef.current?.click()}
          />

          {upload.hasImage && (
            <ProfileImageRemoveButton
              disabled={disabled || upload.isRemoving}
              isRemoving={upload.isRemoving}
              onClick={upload.handleRemove}
            />
          )}
        </div>

        <ProfileImageFileInput
          disabled={disabled}
          inputRef={upload.fileInputRef}
          onFileSelect={upload.handleFileSelect}
        />
      </div>
    </div>
  );
}

function ProfileImageUploadButton({
  disabled,
  hasImage,
  icon,
  isUploading,
  labelWhenEmpty,
  labelWhenFilled,
  onClick,
}: {
  disabled: boolean;
  hasImage: boolean;
  icon: 'camera' | 'image';
  isUploading: boolean;
  labelWhenEmpty: string;
  labelWhenFilled: string;
  onClick: () => void;
}) {
  const Icon = icon === 'camera' ? Camera : ImageUp;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2"
    >
      {isUploading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {hasImage ? labelWhenFilled : labelWhenEmpty}
    </Button>
  );
}

function ProfileImageRemoveButton({
  disabled,
  isRemoving,
  onClick,
}: {
  disabled: boolean;
  isRemoving: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 text-destructive hover:text-destructive"
    >
      {isRemoving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      Remove
    </Button>
  );
}

function ProfileImageFileInput({
  disabled,
  inputRef,
  onFileSelect,
}: {
  disabled: boolean;
  inputRef: Ref<HTMLInputElement>;
  onFileSelect: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <Input
      ref={inputRef}
      type="file"
      accept="image/*"
      onChange={onFileSelect}
      className="hidden"
      disabled={disabled}
    />
  );
}
