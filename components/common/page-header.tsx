import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Alias for description */
  subtitle?: string;
  /** Optional avatar/icon rendered left of the title block */
  avatar?: React.ReactNode;
  /** Optional badge rendered next to the title */
  badge?: React.ReactNode;
  /** Optional actions (buttons, etc.) rendered on the right */
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  subtitle,
  avatar,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  const desc = description ?? subtitle;

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {avatar}
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1
              className="font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
              style={{
                fontSize: 'var(--page-header-title-size)',
                fontWeight: 'var(--page-header-title-weight)',
              }}
            >
              {title}
            </h1>
            {badge}
          </div>
          {desc && (
            <p
              className="mt-1 text-zinc-500 dark:text-zinc-400"
              style={{ fontSize: 'var(--page-header-desc-size)' }}
            >
              {desc}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
