import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'gray';
  description?: string;
}

const colorMap: Record<StatCardProps['color'], { bg: string; text: string }> = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    text: 'text-yellow-600 dark:text-yellow-400',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400',
  },
  gray: {
    bg: 'bg-zinc-100 dark:bg-zinc-900/20',
    text: 'text-zinc-600 dark:text-zinc-400',
  },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  color,
  description,
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg ${colors.bg}`}
          >
            <Icon className={`h-6 w-6 ${colors.text}`} />
          </div>
          <span className="text-foreground text-2xl font-bold">{value}</span>
        </div>
        {description && (
          <p className="text-muted-foreground mt-2 text-xs">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
