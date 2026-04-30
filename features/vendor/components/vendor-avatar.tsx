'use client';

import { Avatar, AvatarFallback } from '@/components/shadcn/avatar';
import { getAvatarColor } from '@/lib/utils/user-profile-utils';
import { cn } from '@/lib/utils';

interface VendorAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<VendorAvatarProps['size']>, string> = {
  sm: 'size-10',
  md: 'size-16',
  lg: 'size-20',
};

function vendorInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function VendorAvatar({
  name,
  size = 'sm',
  className,
}: VendorAvatarProps) {
  const initials = vendorInitials(name);
  const avatarColor = getAvatarColor(initials);

  return (
    <Avatar className={cn(SIZE_CLASSES[size], 'shrink-0', className)}>
      <AvatarFallback className={cn('font-semibold text-white', avatarColor)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
