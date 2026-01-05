'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

export interface ErrorLayoutProps {
  statusCode: number;
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  reasons?: string[];
  actions?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'default' | 'outline' | 'destructive';
  }[];
  showSupport?: boolean;
  additionalInfo?: React.ReactNode;
}

/**
 * Reusable Error Layout Component
 *
 * Provides consistent UI for all HTTP error pages
 */
export function ErrorLayout({
  statusCode,
  title,
  description,
  icon: Icon,
  iconColor = 'text-muted-foreground',
  reasons,
  actions = [],
  showSupport = true,
  additionalInfo,
}: ErrorLayoutProps) {
  const defaultActions = [
    {
      label: 'Go to Dashboard',
      href: '/users/dashboard',
      variant: 'default' as const,
    },
  ];

  const displayActions = actions.length > 0 ? actions : defaultActions;

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
          <div className="text-muted-foreground mb-2 text-sm font-medium">
            Error {statusCode}
          </div>
          <CardTitle className="text-3xl">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {reasons && reasons.length > 0 && (
            <div className="text-muted-foreground text-center text-sm">
              <p className="mb-2">This could be because:</p>
              <ul className="list-inside list-disc space-y-1 text-left">
                {reasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {additionalInfo && (
            <div className="bg-muted/50 rounded-lg border p-4 text-sm">
              {additionalInfo}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-4">
            {displayActions.map((action, index) =>
              action.href ? (
                <Button
                  key={index}
                  variant={action.variant}
                  asChild
                  className="w-full"
                >
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ) : (
                <Button
                  key={index}
                  variant={action.variant}
                  onClick={'onClick' in action ? action.onClick : undefined}
                  className="w-full"
                >
                  {action.label}
                </Button>
              )
            )}
          </div>

          {showSupport && (
            <div className="text-muted-foreground pt-4 text-center text-xs">
              <p>
                Need help? Contact{' '}
                <a
                  href="mailto:support@echno.com"
                  className="text-primary hover:underline"
                >
                  support@echnoai.com
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
