'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  Send,
  Loader2,
  Lock,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  AccessRequestType,
  AccessRequestPriority,
  AccessRequestStatus,
  getPriorityLabel,
} from '@/types/access-request';
import { toast } from '@/lib/styles/toast-styles';

interface RequestAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // What's being requested
  moduleOrResource: string;
  displayName: string;
  description?: string;
  requestType?: AccessRequestType;
  // For resource permissions
  resourceName?: string;
  resourceScope?: string;
}

export function RequestAccessModal({
  open,
  onOpenChange,
  moduleOrResource,
  displayName,
  description,
  requestType = AccessRequestType.MODULE,
  resourceName,
  resourceScope,
}: RequestAccessModalProps) {
  const [step, setStep] = useState<'info' | 'form' | 'success'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<AccessRequestPriority>(
    AccessRequestPriority.NORMAL
  );

  const handleClose = () => {
    setStep('info');
    setReason('');
    setPriority(AccessRequestPriority.NORMAL);
    onOpenChange(false);
  };

  const handleSubmit = async () => {
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
        moduleName:
          requestType === AccessRequestType.MODULE
            ? moduleOrResource
            : undefined,
        resourceName:
          requestType === AccessRequestType.RESOURCE
            ? resourceName || moduleOrResource
            : undefined,
        resourceScope:
          requestType === AccessRequestType.RESOURCE
            ? resourceScope
            : undefined,
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

      setStep('success');
    } catch (error) {
      toast.error('Error', {
        description:
          error instanceof Error ? error.message : 'Failed to submit request',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'info' && (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
                <Lock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
              <DialogTitle className="text-xl">Access Required</DialogTitle>
              <DialogDescription className="mt-2">
                You don&apos;t have permission to access{' '}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {displayName}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              {/* What will be requested */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {requestType === AccessRequestType.MODULE
                      ? 'Module'
                      : 'Permission'}
                  </span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {moduleOrResource}
                    {resourceScope && `:${resourceScope}`}
                  </Badge>
                </div>
                {description && (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button onClick={() => setStep('form')} className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Request Access
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>

              {/* Help text */}
              <p className="text-center text-xs text-zinc-500">
                Your request will be reviewed by a system administrator
              </p>
            </div>
          </>
        )}

        {step === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Request Access to {displayName}
              </DialogTitle>
              <DialogDescription>
                Tell us why you need access to this module
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why you need access..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="resize-none"
                  autoFocus
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

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('info')}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
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
                      Submit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-xl">Request Submitted</DialogTitle>
              <DialogDescription className="mt-2">
                Your access request has been submitted for review. You&apos;ll
                be notified once it&apos;s approved.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-3">
              <Link
                href="/users/dashboard/access-requests"
                className="block w-full"
              >
                <Button variant="outline" className="w-full">
                  View My Requests
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
