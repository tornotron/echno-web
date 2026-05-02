import { Loader2, AlertCircle } from 'lucide-react';

interface OrgGuardProps {
  isLoading: boolean;
  error: unknown;
  organizationId?: number;
  children: React.ReactNode;
}

export function OrgGuard({
  isLoading,
  error,
  organizationId,
  children,
}: OrgGuardProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>
        <p className="text-zinc-500">
          Failed to load data. Please try again later.
        </p>
      </div>
    );
  }

  if (!organizationId) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-yellow-500" />
        <h2 className="mb-2 text-xl font-semibold">No Organization Selected</h2>
        <p className="text-zinc-500">
          Please select an organization to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
