'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShieldX,
  Send,
  ArrowLeft,
  Home,
  FileText,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import {
  AccessRequestType,
  AccessRequestPriority,
  AccessRequestStatus,
  getPriorityLabel,
} from '@/types/access-request';
import { toast } from '@/lib/styles/toast-styles';

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Get parameters from URL
  const resource = searchParams.get('resource') || '';
  const scope = searchParams.get('scope') || '';
  const moduleName = searchParams.get('module') || '';
  const path = searchParams.get('path') || '';
  const message =
    searchParams.get('message') ||
    'You do not have permission to access this resource.';

  // Form state
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<AccessRequestPriority>(
    AccessRequestPriority.NORMAL
  );

  // Determine request type from URL params
  const requestType = moduleName
    ? AccessRequestType.MODULE
    : AccessRequestType.RESOURCE;

  // Handle submit request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reason.length < 10) {
      toast.error('Validation Error', {
        description: 'Please provide a reason (at least 10 characters)',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: requestType,
        resourceName: resource || undefined,
        resourceScope: scope || undefined,
        moduleName: moduleName || undefined,
        reason,
        priority,
        status: AccessRequestStatus.PENDING,
      };

      const response = await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit request');
      }

      toast.success('Request Submitted', {
        description: 'Your access request has been submitted for review',
      });
      router.push('/users/dashboard/access-requests');
    } catch (error) {
      toast.error('Error', {
        description:
          error instanceof Error ? error.message : 'Failed to submit request',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build permission description
  const getPermissionDescription = () => {
    if (moduleName) {
      return `${moduleName} Module`;
    }
    if (resource && scope) {
      // Map scope to CRUD permission label
      const scopeMap: Record<string, string> = {
        create: 'Create',
        read: 'Read',
        update: 'Update',
        delete: 'Delete',
        list: 'Read', // List is essentially read access
        view: 'Read', // View is essentially read access
      };
      const permission = scopeMap[scope.toLowerCase()] || scope;
      return `${permission} permission for ${resource}`;
    }
    if (resource) {
      return resource;
    }
    if (path) {
      return path;
    }
    return 'this resource';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-900">
      <div className="w-full max-w-lg">
        {/* Main Card */}
        <Card className="mb-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <ShieldX className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription className="mt-2 text-base">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Permission Details */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
              <p className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
                Required Permission
              </p>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {getPermissionDescription()}
              </p>
            </div>

            {/* Actions */}
            {showForm ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">
                    Why do you need access?{' '}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="Explain why you need access to this resource..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-zinc-500">
                    Minimum 10 characters ({reason.length}/10)
                  </p>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(value) =>
                      setPriority(value as AccessRequestPriority)
                    }
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AccessRequestPriority).map((p) => (
                        <SelectItem key={p} value={p}>
                          {getPriorityLabel(p)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || reason.length < 10}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <Button className="w-full" onClick={() => setShowForm(true)}>
                  <Send className="mr-2 h-4 w-4" />
                  Request Access
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                  </Button>
                  <Link href="/users/dashboard" className="w-full">
                    <Button variant="outline" className="w-full">
                      <Home className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                </div>
                <Link
                  href="/users/dashboard/access-requests"
                  className="block w-full"
                >
                  <Button variant="ghost" className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    View My Requests
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          If you believe this is an error, please contact your system
          administrator.
        </p>
      </div>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      }
    >
      <AccessDeniedContent />
    </Suspense>
  );
}
