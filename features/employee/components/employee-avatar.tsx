'use client';

import { Employee } from '@/types/employee';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarColor } from '@/lib/utils/user-profile-utils';
import { cn } from '@/lib/utils';

interface EmployeeAvatarProps {
  employee: Pick<Employee, 'name' | 'profilePicture'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<EmployeeAvatarProps['size']>, string> = {
  sm: 'size-10',
  md: 'size-16',
  lg: 'size-20',
};

export function employeeInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function EmployeeAvatar({
  employee,
  size = 'sm',
  className,
}: EmployeeAvatarProps) {
  const initials = employeeInitials(employee.name);
  const avatarColor = getAvatarColor(initials);

  return (
    <Avatar className={cn(SIZE_CLASSES[size], 'shrink-0', className)}>
      <AvatarImage src={employee.profilePicture?.file} alt={employee.name} />
      <AvatarFallback className={cn('font-semibold text-white', avatarColor)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
