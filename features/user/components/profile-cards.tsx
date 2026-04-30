import { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { cn } from '@/lib/utils';

interface ProfileCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  variant?: 'default' | 'gradient' | 'bordered' | 'minimal';
}

export function ProfileCard({
  title,
  description,
  children,
  className,
  icon,
  variant = 'default',
}: ProfileCardProps) {
  const variantStyles = {
    default: 'border-border',
    gradient: 'border-border bg-gradient-to-br from-background to-muted/20',
    bordered: 'border-2 border-primary/20',
    minimal: 'border-none shadow-none',
  };

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              {icon && <span className="text-primary">{icon}</span>}
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface InfoFieldProps {
  label: string;
  value?: ReactNode;
  className?: string;
  valueClassName?: string;
  icon?: ReactNode;
}

export function InfoField({
  label,
  value,
  className,
  valueClassName,
  icon,
}: InfoFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
        {icon && <span className="text-primary">{icon}</span>}
        {label}
      </div>
      <div className={cn('text-sm font-normal', valueClassName)}>
        {value || (
          <span className="text-muted-foreground italic">Not specified</span>
        )}
      </div>
    </div>
  );
}

interface InfoGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function InfoGrid({ children, columns = 2, className }: InfoGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  label,
  value,
  icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'border-border bg-card flex items-center justify-between rounded-lg border p-4',
        className
      )}
    >
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {trend && (
          <p
            className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </p>
        )}
      </div>
      {icon && (
        <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full">
          {icon}
        </div>
      )}
    </div>
  );
}

interface DataListProps {
  items: Array<{
    label: string;
    value: ReactNode;
    icon?: ReactNode;
  }>;
  className?: string;
}

export function DataList({ items, className }: DataListProps) {
  return (
    <dl className={cn('divide-border divide-y', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center justify-between py-3">
          <dt className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            {item.icon && <span className="text-primary">{item.icon}</span>}
            {item.label}
          </dt>
          <dd className="text-sm font-semibold">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
