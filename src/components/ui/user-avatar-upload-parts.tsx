import type { CSSProperties, ChangeEventHandler, Ref } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getUserAvatarUploadInitials,
  USER_AVATAR_UPLOAD_FONT_SIZE_CLASSES,
  USER_AVATAR_UPLOAD_SIZE_CLASSES,
  type UserAvatarUploadSize,
  type UserAvatarUploadUser,
} from './user-avatar-upload-utils';

interface UserAvatarUploadMenuProps {
  circularBorderless: boolean;
  disabled: boolean;
  displayImageUrl: string | null;
  fileInputRef: Ref<HTMLInputElement>;
  hasPersistentImage: boolean;
  isRemoving: boolean;
  isUploading: boolean;
  onFileSelect: ChangeEventHandler<HTMLInputElement>;
  onRemove: () => void;
  onUploadMenuSelect: () => void;
  size: UserAvatarUploadSize;
  user: UserAvatarUploadUser;
}

export function UserAvatarUploadMenu({
  circularBorderless,
  disabled,
  displayImageUrl,
  fileInputRef,
  hasPersistentImage,
  isRemoving,
  isUploading,
  onFileSelect,
  onRemove,
  onUploadMenuSelect,
  size,
  user,
}: UserAvatarUploadMenuProps) {
  return (
    <div className="flex-shrink-0 relative">
      <div className="relative group">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar
              className={cn(
                'relative cursor-pointer bg-[#f1f3f6] dark:bg-zinc-800',
                circularBorderless
                  ? 'rounded-full !border-0 shadow-none !ring-0 outline-none focus-visible:outline-none focus-visible:ring-0'
                  : 'rounded-lg border border-[#d8dee8] shadow-sm ring-4 dark:border-white/10',
                size === 'review' && '!overflow-visible',
                USER_AVATAR_UPLOAD_SIZE_CLASSES[size]
              )}
              style={{ pointerEvents: disabled || isUploading ? 'none' : 'auto' } as CSSProperties}
            >
              {displayImageUrl ? (
                <AvatarImage src={displayImageUrl || undefined} alt={user.name} className={cn('object-cover object-top', circularBorderless ? 'rounded-full' : 'rounded-lg')} />
              ) : (
                <AvatarFallback className={cn(
                  "font-bold text-muted-foreground",
                  circularBorderless ? 'rounded-full' : 'rounded-lg',
                  USER_AVATAR_UPLOAD_FONT_SIZE_CLASSES[size]
                )}>
                  {getUserAvatarUploadInitials(user)}
                </AvatarFallback>
              )}

              {!disabled && !isUploading && (
                <div className={cn(
                  "pointer-events-none absolute z-10 grid h-6 w-6 place-items-center rounded-full border border-border/70 bg-background/95 text-primary shadow-sm backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100",
                  size === 'review' ? '-bottom-1 -right-1' : 'bottom-1 right-1',
                )}>
                  <Upload className="h-3.5 w-3.5" />
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={onFileSelect}
                tabIndex={-1}
                aria-hidden="true"
              />

              {isUploading && <UserAvatarUploadOverlay />}
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onSelect={() => {
                if (disabled || isUploading) return;
                onUploadMenuSelect();
              }}
            >
              <Edit className="h-4 w-4" /> Upload new image
            </DropdownMenuItem>
            {hasPersistentImage && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={(event) => {
                    event.preventDefault();
                    if (!disabled && !isRemoving) {
                      onRemove();
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Remove image
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function UserAvatarUploadOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
      <div className="flex flex-col items-center justify-center space-y-2 p-3">
        <div className="relative">
          <div className="w-8 h-8 border-2 border-primary/20 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <Upload className="absolute inset-0 h-8 w-8 animate-pulse text-primary/60" />
        </div>
        <div className="text-xs text-muted-foreground font-medium">Uploading...</div>
      </div>
    </div>
  );
}

export function UserAvatarUploadError({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div className="text-xs text-destructive text-center bg-destructive/10 px-2 py-1 rounded-md max-w-full">
      {message}
    </div>
  );
}
