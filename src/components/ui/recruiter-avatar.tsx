import type { CSSProperties } from 'react';
import { UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  getAvatarFallbackIconClass,
  getAvatarInitials,
  getAvatarTooltip,
  useCachedAvatarImage,
  type AvatarSize,
  type CachedAvatarUser,
} from './use-cached-avatar-image';

interface RecruiterAvatarProps {
  user: CachedAvatarUser;
  size?: AvatarSize;
  className?: string;
  showTooltip?: boolean;
  forceRefresh?: boolean;
  showBorder?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const fontSizeClasses = {
  xs: 'text-xs',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export function RecruiterAvatar({
  user,
  size = 'md',
  className,
  showTooltip = false,
  forceRefresh = false,
  showBorder = true,
}: RecruiterAvatarProps) {
  const personalColor = user.personalColor || '#3b82f6';
  const initials = getAvatarInitials(user.name, 'R');
  const { imageUrl, isLoading, imageLoaded, handleImageLoad, handleImageError } = useCachedAvatarImage(user, {
    forceRefresh,
    size,
    warningLabel: 'RECRUITER_AVATAR',
  });

  return (
    <Avatar
      className={cn(
        sizeClasses[size],
        'relative bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-800/30',
        'transition-all duration-300 rounded-full',
        showBorder && 'ring-2 ring-offset-2 ring-offset-background',
        isLoading && 'animate-pulse',
        className
      )}
      style={showBorder ? {
        '--tw-ring-color': personalColor,
        '--tw-ring-opacity': '0.8',
      } as CSSProperties : undefined}
      title={getAvatarTooltip(user, showTooltip)}
    >
      {imageUrl ? (
        <AvatarImage
          src={imageUrl}
          alt={user.name || 'Recruiter'}
          className={`object-cover object-top rounded-full image-fade-in ${imageLoaded ? 'loaded' : ''}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : null}
      <AvatarFallback
        className={cn(
          "bg-gradient-to-br from-blue-500/20 to-indigo-600/20 text-blue-700 dark:text-blue-300 font-bold rounded-full",
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

export function RecruiterAvatarCompact({
  user,
  size = 'xs',
  className,
  forceRefresh,
  showBorder = true,
}: RecruiterAvatarProps) {
  return (
    <RecruiterAvatar
      user={user}
      size={size}
      className={className}
      forceRefresh={forceRefresh}
      showBorder={showBorder}
    />
  );
}

export function RecruiterAvatarLarge({ user, className, showBorder = true }: RecruiterAvatarProps) {
  return <RecruiterAvatar user={user} size="xl" className={className} showBorder={showBorder} showTooltip />;
}
