'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthorization } from '@/hooks/use-authorization';
import {
  KEYCLOAK_GROUPS,
  getGroupDisplayName,
  type KeycloakGroup,
} from '@/lib/rbac/role-groups';
import {
  Shield,
  Briefcase,
  Code,
  DollarSign,
  Users,
  HardHat,
  Wrench,
  UserCircle,
  FileText,
  GraduationCap,
} from 'lucide-react';

/**
 * Group color configuration
 */
const GROUP_COLORS: Record<KeycloakGroup, string> = {
  [KEYCLOAK_GROUPS.ADMIN]:
    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800',
  [KEYCLOAK_GROUPS.MANAGEMENT]:
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800',
  [KEYCLOAK_GROUPS.ENGINEERING]:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800',
  [KEYCLOAK_GROUPS.FINANCE]:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800',
  [KEYCLOAK_GROUPS.HR]:
    'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200 border-pink-200 dark:border-pink-800',
  [KEYCLOAK_GROUPS.SITE_OPERATIONS]:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800',
  [KEYCLOAK_GROUPS.FIELD_WORKERS]:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
  [KEYCLOAK_GROUPS.EXTERNAL]:
    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600',
  [KEYCLOAK_GROUPS.CONTRACTORS]:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800',
  [KEYCLOAK_GROUPS.CLIENTS]:
    'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800',
  [KEYCLOAK_GROUPS.TRAINEES]:
    'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 border-teal-200 dark:border-teal-800',
};

/**
 * Group icon configuration
 */
const GROUP_ICONS: Record<
  KeycloakGroup,
  React.ComponentType<{ className?: string }>
> = {
  [KEYCLOAK_GROUPS.ADMIN]: Shield,
  [KEYCLOAK_GROUPS.MANAGEMENT]: Briefcase,
  [KEYCLOAK_GROUPS.ENGINEERING]: Code,
  [KEYCLOAK_GROUPS.FINANCE]: DollarSign,
  [KEYCLOAK_GROUPS.HR]: Users,
  [KEYCLOAK_GROUPS.SITE_OPERATIONS]: HardHat,
  [KEYCLOAK_GROUPS.FIELD_WORKERS]: Wrench,
  [KEYCLOAK_GROUPS.EXTERNAL]: UserCircle,
  [KEYCLOAK_GROUPS.CONTRACTORS]: FileText,
  [KEYCLOAK_GROUPS.CLIENTS]: UserCircle,
  [KEYCLOAK_GROUPS.TRAINEES]: GraduationCap,
};

interface UserGroupBadgeProps {
  /** Show icon with group name */
  showIcon?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show tooltip with all groups */
  showTooltip?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Displays the user's primary group as a styled badge
 *
 * @example
 * ```tsx
 * // Basic usage
 * <UserGroupBadge />
 *
 * // With icon and tooltip
 * <UserGroupBadge showIcon showTooltip />
 *
 * // Small size
 * <UserGroupBadge size="sm" />
 * ```
 */
export function UserGroupBadge({
  showIcon = false,
  size = 'md',
  showTooltip = false,
  className = '',
}: UserGroupBadgeProps) {
  const { primaryGroup, groups, isSystemAdmin, isLoading } = useAuthorization();

  if (isLoading) {
    return (
      <Badge
        variant="outline"
        className="animate-pulse bg-gray-100 dark:bg-gray-800"
      >
        Loading...
      </Badge>
    );
  }

  // System admin gets special badge
  if (isSystemAdmin) {
    const Icon = Shield;
    const sizeClasses = {
      sm: 'text-xs px-1.5 py-0.5',
      md: 'text-sm px-2 py-0.5',
      lg: 'text-base px-3 py-1',
    };
    const iconSize = {
      sm: 'h-3 w-3',
      md: 'h-3.5 w-3.5',
      lg: 'h-4 w-4',
    };

    return (
      <Badge
        className={`border-red-700 bg-red-600 text-white ${sizeClasses[size]} ${className}`}
      >
        {showIcon && <Icon className={`mr-1 ${iconSize[size]}`} />}
        System Admin
      </Badge>
    );
  }

  // No group
  if (!primaryGroup) {
    return (
      <Badge variant="outline" className={className}>
        No Group
      </Badge>
    );
  }

  const Icon = GROUP_ICONS[primaryGroup] || UserCircle;
  const colorClass =
    GROUP_COLORS[primaryGroup] || GROUP_COLORS[KEYCLOAK_GROUPS.EXTERNAL];
  const displayName = getGroupDisplayName(primaryGroup);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-3 py-1',
  };
  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  const badge = (
    <Badge
      variant="outline"
      className={`${colorClass} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <Icon className={`mr-1 ${iconSize[size]}`} />}
      {displayName}
    </Badge>
  );

  if (showTooltip && groups.length > 1) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="mb-1 font-medium">All Groups:</p>
              <ul className="list-inside list-disc">
                {groups.map((g) => (
                  <li key={g}>{getGroupDisplayName(g as KeycloakGroup)}</li>
                ))}
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

/**
 * Displays all user groups as a list of badges
 */
export function UserGroupList({
  showIcons = false,
  size = 'sm',
  className = '',
}: {
  showIcons?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const { groups, isSystemAdmin, isLoading } = useAuthorization();

  if (isLoading) {
    return (
      <Badge variant="outline" className="animate-pulse">
        Loading...
      </Badge>
    );
  }

  if (isSystemAdmin) {
    return (
      <div className={`flex flex-wrap gap-1 ${className}`}>
        <Badge className="bg-red-600 text-white">
          {showIcons && <Shield className="mr-1 h-3 w-3" />}
          System Admin
        </Badge>
      </div>
    );
  }

  if (groups.length === 0) {
    return <Badge variant="outline">No Groups</Badge>;
  }

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-3 py-1',
  };
  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {groups.map((group) => {
        const Icon = GROUP_ICONS[group as KeycloakGroup] || UserCircle;
        const colorClass =
          GROUP_COLORS[group as KeycloakGroup] ||
          GROUP_COLORS[KEYCLOAK_GROUPS.EXTERNAL];
        const displayName = getGroupDisplayName(group as KeycloakGroup);

        return (
          <Badge
            key={group}
            variant="outline"
            className={`${colorClass} ${sizeClasses[size]}`}
          >
            {showIcons && <Icon className={`mr-1 ${iconSize[size]}`} />}
            {displayName}
          </Badge>
        );
      })}
    </div>
  );
}

/**
 * Get group color class by group name
 */
export function getGroupColor(group: KeycloakGroup): string {
  return GROUP_COLORS[group] || GROUP_COLORS[KEYCLOAK_GROUPS.EXTERNAL];
}

/**
 * Get group icon by group name
 */
export function getGroupIcon(
  group: KeycloakGroup
): React.ComponentType<{ className?: string }> {
  return GROUP_ICONS[group] || UserCircle;
}
