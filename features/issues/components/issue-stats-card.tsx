import { Card } from '@/components/shadcn/card';
import { cn } from '@/lib/utils/index';
import { AlertCircle, Clock, CheckCircle, FileText } from 'lucide-react';

interface IssueStatsCardProps {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
}

export function IssueStatsCard({
  totalIssues,
  openIssues,
  inProgressIssues,
  resolvedIssues,
}: IssueStatsCardProps) {
  const stats = [
    {
      label: 'Total Issues',
      count: totalIssues,
      icon: FileText,
      description: 'across all projects',
      valueClass: 'text-zinc-900 dark:text-zinc-100',
      iconBg: 'bg-blue-50 dark:bg-blue-950/30',
      iconClass: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Open',
      count: openIssues,
      icon: AlertCircle,
      description: 'need attention',
      valueClass: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-50 dark:bg-red-950/30',
      iconClass: 'text-red-600 dark:text-red-400',
    },
    {
      label: 'In Progress',
      count: inProgressIssues,
      icon: Clock,
      description: 'being worked on',
      valueClass: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-950/30',
      iconClass: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Resolved',
      count: resolvedIssues,
      icon: CheckCircle,
      description: 'successfully closed',
      valueClass: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconClass: 'text-emerald-600 dark:text-emerald-400',
    },
  ] as const;

  return (
    <Card className="gap-0 p-6">
      <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
        {stats.map(
          (
            {
              label,
              count,
              icon: Icon,
              description,
              valueClass,
              iconBg,
              iconClass,
            },
            i
          ) => {
            const padClass =
              i === 0 ? 'sm:pr-6' : i === 3 ? 'sm:pl-6' : 'sm:px-6';
            return (
              <div
                key={label}
                className={cn(
                  'flex flex-col gap-1 rounded-lg p-3 sm:rounded-none',
                  padClass
                )}
              >
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {label}
                </p>
                <div className="flex items-center justify-between">
                  <p
                    className={`text-2xl font-bold tracking-tight ${valueClass}`}
                  >
                    {count}
                  </p>
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
                  >
                    <Icon className={`size-4 ${iconClass}`} />
                  </div>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {description}
                </p>
              </div>
            );
          }
        )}
      </div>
    </Card>
  );
}
