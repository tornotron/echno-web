import * as React from 'react';
import Image from 'next/image';
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

  if (user.profilePicture?.file) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-full',
          sizeClasses[size],
          className
        )}
      >
        <Image
          src={user.profilePicture.file}
          alt={user.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
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
