import { UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  getAvatarFallbackIconClass,
  getAvatarInitials,
  getAvatarTooltip,
  useCachedAvatarImage,
  type CachedAvatarUser,
} from './use-cached-avatar-image';

type ApplicantAvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface ApplicantAvatarProps {
  user: CachedAvatarUser;
  size?: ApplicantAvatarSize;
  shape?: 'rounded' | 'circle';
  className?: string;
  showTooltip?: boolean;
  forceRefresh?: boolean;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-12 w-12',
};

const fontSizeClasses = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-base',
};

export function ApplicantAvatar({
  user,
  size = 'md',
  shape = 'rounded',
  className,
  showTooltip = false,
  forceRefresh = false,
}: ApplicantAvatarProps) {
  const personalColor = user.personalColor || '#3b82f6';
  const initials = getAvatarInitials(user.name, 'C');
  const { imageUrl, isLoading, imageLoaded, handleImageLoad, handleImageError } = useCachedAvatarImage(user, {
    forceRefresh,
    size,
    warningLabel: 'APPLICANT_AVATAR',
  });

  return (
    <Avatar
      className={cn(
        sizeClasses[size],
        'relative bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-800/30',
        'transition-all duration-300',
        shape === 'circle' ? 'rounded-full' : 'rounded-md',
        isLoading && 'animate-pulse',
        className
      )}
      title={getAvatarTooltip(user, showTooltip)}
    >
      {imageUrl ? (
        <AvatarImage
          src={imageUrl}
          alt={user.name || 'Applicant'}
          className={cn(
            'object-cover object-top image-fade-in',
            shape === 'circle' ? 'rounded-full' : 'rounded-md',
            imageLoaded && 'loaded',
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : null}
      <AvatarFallback
        className={cn(
          "bg-gradient-to-br from-blue-500/20 to-indigo-600/20 text-blue-700 dark:text-blue-300 font-bold",
          shape === 'circle' ? 'rounded-full' : 'rounded-md',
          fontSizeClasses[size]
        )}
        style={{
          backgroundColor: `${personalColor}20`,
          color: personalColor,
        }}
      >
        {initials || <UserCircle className={getAvatarFallbackIconClass(size)} />}
      </AvatarFallback>
    </Avatar>
  );
}

export function ApplicantAvatarCompact({ user, size = 'sm', shape = 'rounded', className, forceRefresh }: ApplicantAvatarProps) {
  return (
    <ApplicantAvatar
      user={user}
      size={size}
      shape={shape}
      className={className}
      forceRefresh={forceRefresh}
    />
  );
}

export function ApplicantAvatarLarge({ user, className }: ApplicantAvatarProps) {
  return <ApplicantAvatar user={user} size="xl" className={className} showTooltip />;
}
