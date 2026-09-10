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

interface UserAvatarProps {
  user: CachedAvatarUser;
  size?: AvatarSize;
  className?: string;
  showTooltip?: boolean;
  forceRefresh?: boolean;
  variant?: 'default' | 'plain';
}

const sizeClasses = {
  xs: 'h-6 w-6',
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

export function UserAvatar({
  user,
  size = 'md',
  className,
  showTooltip = false,
  forceRefresh = false,
  variant = 'default',
}: UserAvatarProps) {
  const personalColor = user.personalColor || '#3b82f6';
  const initials = getAvatarInitials(user.name, 'U');
  const { imageUrl, isLoading, imageLoaded, handleImageLoad, handleImageError } = useCachedAvatarImage(user, {
    forceRefresh,
    size,
    warningLabel: 'USER_AVATAR',
  });

  return (
    <div className="relative group">
      <Avatar
        className={cn(
          sizeClasses[size],
          'relative rounded-full border border-[#d8dee8] bg-[#f1f3f6] shadow-sm dark:border-white/10 dark:bg-zinc-800',
          'transition-all duration-200 rounded-full',
          isLoading && (user.avatarUrl || user.image) && 'animate-pulse',
          className
        )}
        style={{
          '--tw-ring-color': `${personalColor}80`,
          '--tw-ring-opacity': variant === 'default' ? '0.8' : '0',
        } as CSSProperties}
        title={getAvatarTooltip(user, showTooltip)}
      >
        {imageUrl ? (
          <AvatarImage
            src={imageUrl}
            alt={user.name || 'User'}
            className={`object-cover object-top rounded-full image-fade-in ${imageLoaded ? 'loaded' : ''}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : null}
        <AvatarFallback
          className={cn(
            "bg-muted text-muted-foreground font-semibold rounded-full",
            fontSizeClasses[size]
          )}
          style={{
            backgroundColor: `${personalColor}16`,
            color: personalColor,
          }}
        >
          {initials || <UserCircle className={getAvatarFallbackIconClass(size)} />}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

export function UserAvatarCompact({
  user,
  size = 'sm',
  className,
  forceRefresh,
  variant = 'default',
}: UserAvatarProps) {
  return (
    <UserAvatar
      user={user}
      size={size}
      className={className}
      forceRefresh={forceRefresh}
      variant={variant}
    />
  );
}

export function UserAvatarLarge({ user, className }: UserAvatarProps) {
  return <UserAvatar user={user} size="xl" className={className} showTooltip />;
}
