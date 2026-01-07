'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Upload,
  X,
  Save,
  Send,
  AlertCircle,
  User,
  FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { differenceInBusinessDays, parseISO, format } from 'date-fns';
import { LeaveType, getLeaveTypeLabel, getLeaveTypeColor } from '@/types/leave';
import { mockEmployeeLeaveQuotas } from '@/components/shared/mock-data';
import { toast } from '@/lib/styles/toast-styles';

export default function ApplyLeavePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [leaveType, setLeaveType] = useState<string>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [halfDay, setHalfDay] = useState<string>('full');
  const [reason, setReason] = useState('');
  const [delegateTo, setDelegateTo] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  // For demo, using employee ID 1 (Rajesh Kumar)
  const employeeId = '1';
  const quota = mockEmployeeLeaveQuotas.find(
    (q) => q.employeeId === employeeId
  );

  // Calculate leave days
  const calculateDays = () => {
    if (!fromDate || !toDate) return 0;

    const start = parseISO(fromDate);
    const end = parseISO(toDate);

    if (end < start) return 0;

    const businessDays = differenceInBusinessDays(end, start) + 1;

    if (halfDay === 'first-half' || halfDay === 'second-half') {
      return 0.5;
    }

    return businessDays;
  };

  const leaveDays = calculateDays();

  // Get available balance for selected leave type
  const getAvailableBalance = () => {
    if (!leaveType || !quota) return 0;
    const balance = quota.balances.find((b) => b.leaveType === leaveType);
    return balance ? balance.available + balance.carriedForward : 0;
  };

  const availableBalance = getAvailableBalance();

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = [...e.target.files];
      setAttachments([...attachments, ...newFiles]);
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = () => {
    if (!leaveType) {
      toast.error('Validation Error', {
        description: 'Please select a leave type',
      });
      return false;
    }
    if (!fromDate || !toDate) {
      toast.error('Validation Error', {
        description: 'Please select from and to dates',
      });
      return false;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      toast.error('Validation Error', {
        description: 'From date cannot be after to date',
      });
      return false;
    }
    if (leaveDays > availableBalance) {
      toast.error('Insufficient Balance', {
        description: `You only have ${availableBalance} days available for ${getLeaveTypeLabel(leaveType as LeaveType)}`,
      });
      return false;
    }
    if (!reason.trim()) {
      toast.error('Validation Error', {
        description: 'Please provide a reason for leave',
      });
      return false;
    }
    if (reason.trim().length < 10) {
      toast.error('Validation Error', {
        description: 'Reason must be at least 10 characters',
      });
      return false;
    }
    return true;
  };

  // Handle save as draft
  const handleSaveDraft = async () => {
    if (!leaveType || !fromDate || !toDate) {
      toast.error('Validation Error', {
        description: 'Please fill in leave type and dates before saving draft',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement API call to save draft
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Draft Saved', {
        description: 'Your leave request has been saved as draft',
      });
      router.push('/dashboard/workforce/leaves');
    } catch {
      toast.error('Error', {
        description: 'Failed to save draft. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement API call to submit leave request
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success('Leave Request Submitted', {
        description: `Your leave request for ${leaveDays} day(s) has been submitted for approval`,
      });
      router.push('/dashboard/workforce/leaves');
    } catch {
      toast.error('Error', {
        description: 'Failed to submit leave request. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Apply for Leave
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Submit a new leave request
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Leave Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Leave Details
                </CardTitle>
                <CardDescription>
                  Provide information about your leave request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Leave Type */}
                <div className="space-y-2">
                  <Label htmlFor="leaveType">
                    Leave Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger id="leaveType">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(LeaveType).map((type) => {
                        const balance = quota?.balances.find(
                          (b) => b.leaveType === type
                        );
                        const available = balance
                          ? balance.available + balance.carriedForward
                          : 0;

                        return (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center justify-between gap-4">
                              <span>{getLeaveTypeLabel(type)}</span>
                              <Badge
                                variant="outline"
                                className={`${getLeaveTypeColor(type)} text-xs`}
                              >
                                {available} days
                              </Badge>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fromDate">
                      From Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toDate">
                      To Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      min={fromDate || format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                </div>

                {/* Half Day Option */}
                {fromDate && toDate && fromDate === toDate && (
                  <div className="space-y-2">
                    <Label htmlFor="halfDay">Day Type</Label>
                    <Select value={halfDay} onValueChange={setHalfDay}>
                      <SelectTrigger id="halfDay">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Day</SelectItem>
                        <SelectItem value="first-half">First Half</SelectItem>
                        <SelectItem value="second-half">Second Half</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Days Calculation */}
                {leaveDays > 0 && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Total Leave Days
                      </span>
                      <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {leaveDays}
                      </span>
                    </div>
                    {availableBalance < leaveDays && (
                      <div className="mt-2 flex items-start gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span className="text-xs">
                          Insufficient balance. You have only {availableBalance}{' '}
                          days available.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">
                    Reason for Leave <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="Please provide a detailed reason for your leave request..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Minimum 10 characters ({reason.length}/10)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Work Delegation Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Work Delegation
                </CardTitle>
                <CardDescription>
                  Assign your responsibilities to a colleague during your
                  absence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Delegate To */}
                <div className="space-y-2">
                  <Label htmlFor="delegateTo">Delegate To</Label>
                  <Select value={delegateTo} onValueChange={setDelegateTo}>
                    <SelectTrigger id="delegateTo">
                      <SelectValue placeholder="Select a colleague" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">
                        Priya Sharma - Engineering
                      </SelectItem>
                      <SelectItem value="3">
                        Amit Patel - Engineering
                      </SelectItem>
                      <SelectItem value="4">
                        Sneha Reddy - Engineering
                      </SelectItem>
                      <SelectItem value="5">
                        Vikram Singh - Engineering
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Responsibilities */}
                {delegateTo && (
                  <div className="space-y-2">
                    <Label htmlFor="responsibilities">
                      Responsibilities to Delegate
                    </Label>
                    <Textarea
                      id="responsibilities"
                      placeholder="List the tasks and responsibilities to be handled during your absence..."
                      value={responsibilities}
                      onChange={(e) => setResponsibilities(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attachments Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Attachments
                </CardTitle>
                <CardDescription>
                  Upload supporting documents (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="attachments">Upload Files</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="attachments"
                      type="file"
                      onChange={handleFileChange}
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        (
                          document.querySelector('#attachments') as HTMLElement
                        )?.click()
                      }
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Files
                    </Button>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      PDF, DOC, DOCX, JPG, PNG (Max 5MB each)
                    </span>
                  </div>
                </div>

                {/* Attachment List */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-zinc-500" />
                          <span className="text-sm text-zinc-900 dark:text-zinc-100">
                            {file.name}
                          </span>
                          <span className="text-xs text-zinc-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
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
                disabled={isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || leaveDays > availableBalance}
                className="ml-auto"
              >
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leave Balance Card */}
            {leaveType && quota && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {getLeaveTypeLabel(leaveType as LeaveType)} Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const balance = quota.balances.find(
                      (b) => b.leaveType === leaveType
                    );
                    if (!balance) return null;

                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">
                            Allocated
                          </span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {balance.allocated}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">
                            Used
                          </span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {balance.used}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">
                            Pending
                          </span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {balance.pending}
                          </span>
                        </div>
                        {balance.carriedForward > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Carried Forward
                            </span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              +{balance.carriedForward}
                            </span>
                          </div>
                        )}
                        <div className="h-px bg-zinc-200 dark:bg-zinc-700" />
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            Available
                          </span>
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">
                            {balance.available + balance.carriedForward}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
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
                    <span>
                      Leave requests should be submitted at least 3 days in
                      advance
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-zinc-400">•</span>
                    <span>Weekends are excluded from leave calculation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-zinc-400">•</span>
                    <span>Medical leaves may require supporting documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-zinc-400">•</span>
                    <span>Approval is subject to manager discretion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-zinc-400">•</span>
                    <span>You can save as draft and submit later</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Leave Policy */}
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Leave Policy
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Please review the company leave policy before submitting
                      your request.
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
