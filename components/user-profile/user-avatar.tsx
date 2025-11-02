import * as React from 'react';
import { User, userInitials } from '@/types/user/user';
import { getAvatarColor } from '@/lib/utils/user-profile-utils';
import { cn } from '@/lib/utils/tailwind-utils';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-16 w-16 text-xl',
  lg: 'h-24 w-24 text-3xl',
  xl: 'h-32 w-32 text-4xl',
};

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const initials = userInitials(user);
  const avatarColor = getAvatarColor(initials);

  if (user.profilePictureUrl) {
    return (
      <div className={cn('relative overflow-hidden rounded-full', sizeClasses[size], className)}>
        <img
          src={user.profilePictureUrl}
          alt={user.name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white',
        avatarColor,
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
