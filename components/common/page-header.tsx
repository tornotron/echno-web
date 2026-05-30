import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  /** Alias for description */
  subtitle?: React.ReactNode;
  /** Optional avatar/icon rendered left of the title block */
  avatar?: React.ReactNode;
  /** Optional badge rendered next to the title */
  badge?: React.ReactNode;
  /** Optional actions (buttons, etc.) rendered on the right */
  actions?: React.ReactNode;
  className?: string;
  /**
   * When true the header sticks below the global app bar (top-16) while the
   * page content scrolls beneath it. Use on create/edit pages where actions
   * live in the header and must stay accessible without scrolling.
   */
  sticky?: boolean;
}

export function PageHeader({
  title,
  description,
  subtitle,
  avatar,
  badge,
  actions,
  className,
  sticky,
}: PageHeaderProps) {
  const desc = description ?? subtitle;

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        sticky &&
          'sticky top-16 z-10 -mx-3 bg-slate-100 px-3 pt-3 pb-3 sm:-mx-4 sm:px-4 lg:-mx-6 lg:px-6 dark:bg-slate-800/50',
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
