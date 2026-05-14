import { Card } from '@/components/shadcn/card';
import { cn } from '@/lib/utils/index';
import { ListTodo, Clock, Activity, CheckCircle } from 'lucide-react';

interface TaskStatsCardProps {
  totalTasks: number;
  upcomingTasks: number;
  onGoingTasks: number;
  completedTasks: number;
  totalDescription?: string;
}

export function TaskStatsCard({
  totalTasks,
  upcomingTasks,
  onGoingTasks,
  completedTasks,
  totalDescription = 'across this project',
}: TaskStatsCardProps) {
  const stats = [
    {
      label: 'Total Tasks',
      count: totalTasks,
      icon: ListTodo,
      description: totalDescription,
      valueClass: 'text-zinc-900 dark:text-zinc-100',
      iconBg: 'bg-blue-50 dark:bg-blue-950/30',
      iconClass: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Upcoming',
      count: upcomingTasks,
      icon: Clock,
      description: 'not yet started',
      valueClass: 'text-zinc-500 dark:text-zinc-400',
      iconBg: 'bg-zinc-100 dark:bg-zinc-800',
      iconClass: 'text-zinc-500 dark:text-zinc-400',
    },
    {
      label: 'On Going',
      count: onGoingTasks,
      icon: Activity,
      description: 'currently in progress',
      valueClass: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-950/30',
      iconClass: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Completed',
      count: completedTasks,
      icon: CheckCircle,
      description: 'successfully done',
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
            let padClass = 'sm:px-6';
            if (i === 0) padClass = 'sm:pr-6';
            else if (i === 3) padClass = 'sm:pl-6';
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
