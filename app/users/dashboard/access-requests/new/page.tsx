'use client';

import { useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  AccessRequestType,
  AccessRequestPriority,
  getTypeLabel,
  getPriorityLabel,
  validateCreateInput,
  type CreateAccessRequestInput,
} from '@/types/access-request';
import { SYSTEM_ROLES, getRoleDisplayName } from '@/types/rbac/role';
import { toast } from '@/lib/styles/toast-styles';

// Module options for module access requests
const MODULES = [
  { value: 'FINANCE', label: 'Finance Module' },
  { value: 'WORKFORCE', label: 'Workforce Module' },
  { value: 'PROJECT', label: 'Project Module' },
  { value: 'INVENTORY', label: 'Inventory Module' },
  { value: 'RESOURCES', label: 'Resources Module' },
  { value: 'THIRD_PARTY', label: 'Third Party Module' },
  { value: 'REPORTS', label: 'Reports Module' },
  { value: 'ADMIN', label: 'Admin Module' },
];

export default function NewAccessRequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Form state
  const [requestType, setRequestType] = useState<AccessRequestType | ''>('');
  const [resourceName, setResourceName] = useState('');
  const [resourceScope, setResourceScope] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [reason, setReason] = useState('');
  const [businessJustification, setBusinessJustification] = useState('');
  const [priority, setPriority] = useState<AccessRequestPriority>(
    AccessRequestPriority.NORMAL
  );
  const [requestedDuration, setRequestedDuration] = useState<
    'permanent' | 'temporary'
  >('permanent');
  const [expiresAt, setExpiresAt] = useState('');

  // Mark field as touched
  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Real-time validation
  const validation = useMemo(() => {
    const errors: Record<string, string> = {};

    if (!requestType) {
      errors.requestType = 'Please select a request type';
    }

    if (requestType === AccessRequestType.RESOURCE) {
      if (!resourceName) errors.resourceName = 'Please select a resource';
      if (!resourceScope)
        errors.resourceScope = 'Please select a permission scope';
    }

    if (requestType === AccessRequestType.MODULE && !moduleName)
      errors.moduleName = 'Please select a module';

    if (requestType === AccessRequestType.ROLE && !roleName)
      errors.roleName = 'Please select a role';

    if (!reason) {
      errors.reason = 'Please provide a reason';
    } else if (reason.length < 10) {
      errors.reason = `Reason must be at least 10 characters (${reason.length}/10)`;
    }

    if (requestedDuration === 'temporary' && !expiresAt) {
      errors.expiresAt = 'Please select an expiry date';
    }

    return errors;
  }, [
    requestType,
    resourceName,
    resourceScope,
    moduleName,
    roleName,
    reason,
    requestedDuration,
    expiresAt,
  ]);

  const isValid = Object.keys(validation).length === 0;
  const getFieldError = (field: string) =>
    touched[field] ? validation[field] : undefined;

  // Build input for validation
  const buildInput = (): CreateAccessRequestInput => ({
    type: requestType as AccessRequestType,
    resourceName: resourceName || undefined,
    resourceScope: resourceScope || undefined,
    moduleName: moduleName || undefined,
    roleName: roleName || undefined,
    reason,
    businessJustification: businessJustification || undefined,
    priority,
    requestedDuration,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  });

  // Handle save as draft (simulated with mock data)
  const handleSaveDraft = async () => {
    if (!requestType) {
      toast.error('Validation Error', {
        description: 'Please select a request type before saving draft',
      });
      return;
    }

    setIsSubmitting(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    toast.success('Draft Saved', {
      description: 'Your access request has been saved as draft',
    });
    router.push('/users/dashboard/access-requests');
    setIsSubmitting(false);
  };

  // Handle submit (simulated with mock data)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const input = buildInput();
    const validationError = validateCreateInput(input);
    if (validationError) {
      toast.error('Validation Error', {
        description: validationError,
      });
      return;
    }

    setIsSubmitting(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    toast.success('Request Submitted', {
      description: 'Your access request has been submitted for review',
    });
    router.push('/users/dashboard/access-requests');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Request Access
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Submit a request for additional permissions, module access, or roles
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Request Type Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Access Type
                </CardTitle>
                <CardDescription>
                  Select what type of access you need
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Request Type */}
                <div className="space-y-2">
                  <Label htmlFor="requestType">
                    Request Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={requestType}
                    onValueChange={(value) => {
                      setRequestType(value as AccessRequestType);
                      // Reset type-specific fields
                      setResourceName('');
                      setResourceScope('');
                      setModuleName('');
                      setRoleName('');
                    }}
                  >
                    <SelectTrigger id="requestType">
                      <SelectValue placeholder="Select request type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AccessRequestType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {getTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Resource Permission Fields */}
                {requestType === AccessRequestType.RESOURCE && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="resourceName">
                        Resource <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="resourceName"
                        placeholder="e.g., Employee Records, Reports"
                        value={resourceName}
                        onChange={(e) => setResourceName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resourceScope">
                        Permission <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="resourceScope"
                        placeholder="e.g., view, create, update, delete"
                        value={resourceScope}
                        onChange={(e) => setResourceScope(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Module Access Fields */}
                {requestType === AccessRequestType.MODULE && (
                  <div className="space-y-2">
                    <Label htmlFor="moduleName">
                      Module <span className="text-red-500">*</span>
                    </Label>
                    <Select value={moduleName} onValueChange={setModuleName}>
                      <SelectTrigger id="moduleName">
                        <SelectValue placeholder="Select module" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODULES.map((module) => (
                          <SelectItem key={module.value} value={module.value}>
                            {module.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Role Assignment Fields */}
                {requestType === AccessRequestType.ROLE && (
                  <div className="space-y-2">
                    <Label htmlFor="roleName">
                      Role <span className="text-red-500">*</span>
                    </Label>
                    <Select value={roleName} onValueChange={setRoleName}>
                      <SelectTrigger id="roleName">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(SYSTEM_ROLES).map((role) => (
                          <SelectItem key={role} value={role}>
                            {getRoleDisplayName(role)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

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

                {/* Duration */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Access Duration</Label>
                    <Select
                      value={requestedDuration}
                      onValueChange={(value) =>
                        setRequestedDuration(value as 'permanent' | 'temporary')
                      }
                    >
                      <SelectTrigger id="duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="permanent">Permanent</SelectItem>
                        <SelectItem value="temporary">Temporary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {requestedDuration === 'temporary' && (
                    <div className="space-y-2">
                      <Label htmlFor="expiresAt">
                        Expires On <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="expiresAt"
                        type="date"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Justification Card */}
            <Card>
              <CardHeader>
                <CardTitle>Justification</CardTitle>
                <CardDescription>
                  Explain why you need this access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">
                    Reason <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="Briefly explain why you need this access..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    onBlur={() => markTouched('reason')}
                    rows={3}
                    className={cn(
                      'resize-none',
                      getFieldError('reason') &&
                        'border-red-500 focus-visible:ring-red-500'
                    )}
                  />
                  <div className="flex items-center justify-between">
                    {getFieldError('reason') ? (
                      <p className="text-xs text-red-500">
                        {getFieldError('reason')}
                      </p>
                    ) : reason.length >= 10 ? (
                      <p className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Reason looks good
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Minimum 10 characters
                      </p>
                    )}
                    <span
                      className={cn(
                        'text-xs',
                        reason.length >= 10 ? 'text-green-600' : 'text-zinc-400'
                      )}
                    >
                      {reason.length}/10
                    </span>
                  </div>
                </div>

                {/* Business Justification */}
                <div className="space-y-2">
                  <Label htmlFor="businessJustification">
                    Business Justification (Optional)
                  </Label>
                  <Textarea
                    id="businessJustification"
                    placeholder="Provide additional business context if needed..."
                    value={businessJustification}
                    onChange={(e) => setBusinessJustification(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSubmitting || !requestType}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save as Draft
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="ml-auto"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>

            {/* Validation Summary */}
            {!isValid && Object.keys(touched).length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Please complete the required fields
                    </p>
                    <ul className="mt-1 list-inside list-disc text-xs text-amber-700 dark:text-amber-300">
                      {Object.values(validation)
                        .slice(0, 3)
                        .map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      {Object.keys(validation).length > 3 && (
                        <li>
                          And {Object.keys(validation).length - 3} more...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Request Summary */}
            {requestType && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Request Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Type
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {getTypeLabel(requestType)}
                      </span>
                    </div>
                    {requestType === AccessRequestType.RESOURCE &&
                      resourceName && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Resource
                            </span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {resourceName}
                            </span>
                          </div>
                          {resourceScope && (
                            <div className="flex justify-between">
                              <span className="text-zinc-600 dark:text-zinc-400">
                                Permission
                              </span>
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {resourceScope}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    {requestType === AccessRequestType.MODULE && moduleName && (
                      <div className="flex justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Module
                        </span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {moduleName}
                        </span>
                      </div>
                    )}
                    {requestType === AccessRequestType.ROLE && roleName && (
                      <div className="flex justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Role
                        </span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {roleName}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Priority
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {getPriorityLabel(priority)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Duration
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {requestedDuration === 'permanent'
                          ? 'Permanent'
                          : 'Temporary'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Important Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Important Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-start gap-2">
                    <span className="text-zinc-400">•</span>
                    <span>All access requests require admin approval</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-zinc-400">•</span>
                    <span>Provide a clear reason to expedite approval</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-zinc-400">•</span>
                    <span>
                      Urgent requests may require additional justification
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-zinc-400">•</span>
                    <span>You can save as draft and submit later</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Access Policy */}
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Access Policy
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Access is granted based on the principle of least
                      privilege. Request only the permissions you need.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
