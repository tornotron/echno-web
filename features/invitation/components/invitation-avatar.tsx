'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarColor } from '@/lib/utils/user-profile-utils';
import { cn } from '@/lib/utils';

interface InvitationAvatarProps {
  name?: string;
  className?: string;
}

function invitationInitials(name?: string): string {
  if (!name?.trim()) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function InvitationAvatar({ name, className }: InvitationAvatarProps) {
  const initials = invitationInitials(name);
  const avatarColor = getAvatarColor(initials);

  return (
    <Avatar className={cn('size-10 shrink-0', className)}>
      <AvatarFallback className={cn('font-semibold text-white', avatarColor)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
