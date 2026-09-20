'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import { Button } from '@/components/shadcn/button';
import { useCan } from '@/hooks/use-can';
import type { AccessConfig } from '@/nav/access/roles';

export interface AccessGateProps {
  /** The org-role gate from `nav/access/roles` that mirrors the backend guard. */
  config: AccessConfig;
  /** What the reader was refused, in the reader's words: "view vendors". */
  subject: string;
  /** Who is admitted, in the reader's words: "system administrators and store keepers". */
  allowed: string;
  /** Where the back button goes. */
  backHref: string;
  /** The back button's label. */
  backLabel: string;
  children: ReactNode;
}

/**
 * Holds a page behind an org-role gate. Renders nothing while the employee
 * record loads, the children once the reader passes, and otherwise the same
 * "Access Denied" notice the finance pages already show, so a reader who
 * follows a stale link sees a sentence rather than a 403 from the API.
 */
export function AccessGate({
  config,
  subject,
  allowed,
  backHref,
  backLabel,
  children,
}: AccessGateProps) {
  const { allowed: pass, isLoading } = useCan(config);

  if (isLoading) return null;

  if (!pass) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don&apos;t have permission to {subject}. This is restricted to{' '}
            {allowed}.
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
