'use client';

import { User, userInitials } from '@/types/user/user';
import { getAvatarColor } from '@/lib/utils/user-profile-utils';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/shadcn/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps['size']>, string> = {
  sm: 'size-10 text-sm',
  md: 'size-16 text-xl',
  lg: 'size-24 text-3xl',
  xl: 'size-32 text-4xl',
};

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const initials = userInitials(user);
  const avatarColor = getAvatarColor(initials);

  return (
    <Avatar className={cn(SIZE_CLASSES[size], className)}>
      <AvatarImage src={user.profilePicture?.file} alt={user.name} />
      <AvatarFallback className={cn('font-semibold text-white', avatarColor)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
