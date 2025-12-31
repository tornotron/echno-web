'use client';

import { use, useState } from 'react';
import { AppLayout } from '@/components/common';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  User,
  Building,
  FileText,
  Clock,
  Check,
  X,
  Download,
  Mail,
  Phone,
  UserCheck,
  MessageSquare,
  ArrowUpCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  mockLeaveRequests,
  mockEmployees,
} from '@/components/shared/mock-data';
import {
  getLeaveStatusLabel,
  getLeaveStatusColor,
  getLeaveTypeLabel,
  getLeaveTypeColor,
  LeaveStatus,
} from '@/types/leave';
import { notFound } from 'next/navigation';
import { toast } from 'sonner';

export default function LeaveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const leave = mockLeaveRequests.find((l) => l.id === id);

  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
  const [escalateData, setEscalateData] = useState({
    seniorAuthorityId: '',
    reason: '',
  });

  if (!leave) {
    notFound();
  }

  // Get list of senior authorities (managers, directors, etc.)
  const seniorAuthorities = mockEmployees.filter(
    (emp) =>
      emp.designation.toLowerCase().includes('manager') ||
      emp.designation.toLowerCase().includes('director') ||
      emp.designation.toLowerCase().includes('head')
  );

  const handleApprove = () => {
    logger.debug(`Approving leave: ${id}`);
    toast.success('Leave request approved successfully');
    // TODO: Implement API call
  };

  const handleReject = () => {
    logger.debug(`Rejecting leave: ${id}`);
    toast.error('Leave request rejected');
    // TODO: Implement API call
  };

  const handleEscalate = () => {
    if (!escalateData.seniorAuthorityId) {
      toast.error('Please select a senior authority');
      return;
    }
    if (!escalateData.reason.trim()) {
      toast.error('Please provide a reason for escalation');
      return;
    }

    const selectedAuthority = seniorAuthorities.find(
      (emp) => emp.employeeId === escalateData.seniorAuthorityId
    );

    logger.debug('Escalating leave to:', escalateData);
    toast.success(
      `Leave request escalated to ${selectedAuthority?.name || 'senior authority'}`
    );

    // Reset form and close dialog
    setEscalateData({
      seniorAuthorityId: '',
      reason: '',
    });
    setEscalateDialogOpen(false);
    // TODO: Implement API call
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Leave Request Details
            </h1>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">
              ID: {leave.id}
            </p>
          </div>

          {leave.status === LeaveStatus.pending && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEscalateDialogOpen(true)}
              >
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                Escalate
              </Button>
              <Button
                variant="default"
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Leave Information */}
          <div className="space-y-6 md:col-span-2">
            {/* Leave Details Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Leave Information</CardTitle>
                  <Badge className={getLeaveStatusColor(leave.status)}>
                    {getLeaveStatusLabel(leave.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-sm text-zinc-500">
                      <Calendar className="h-4 w-4" />
                      Leave Type
                    </div>
                    <Badge className={getLeaveTypeColor(leave.leaveType)}>
                      {getLeaveTypeLabel(leave.leaveType)}
                    </Badge>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center gap-2 text-sm text-zinc-500">
                      <Clock className="h-4 w-4" />
                      Duration
                    </div>
                    <p className="font-medium">{leave.daysCount} Days</p>
                  </div>

                  <div>
                    <div className="mb-1 text-sm text-zinc-500">From Date</div>
                    <p className="font-medium">
                      {format(leave.fromDate, 'EEEE, dd MMMM yyyy')}
                    </p>
                  </div>

                  <div>
                    <div className="mb-1 text-sm text-zinc-500">To Date</div>
                    <p className="font-medium">
                      {format(leave.toDate, 'EEEE, dd MMMM yyyy')}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500">
                    <FileText className="h-4 w-4" />
                    Reason for Leave
                  </div>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {leave.reason}
                  </p>
                </div>

                {leave.remarks && (
                  <>
                    <Separator />
                    <div>
                      <div className="mb-2 text-sm text-zinc-500">
                        Additional Remarks
                      </div>
                      <p className="text-zinc-900 dark:text-zinc-100">
                        {leave.remarks}
                      </p>
                    </div>
                  </>
                )}

                {leave.emergencyContact && (
                  <>
                    <Separator />
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500">
                        <Phone className="h-4 w-4" />
                        Emergency Contact
                      </div>
                      <p className="font-medium">{leave.emergencyContact}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Work Delegation Card */}
            {leave.delegation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Work Delegation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-1 text-sm text-zinc-500">
                      Delegated To
                    </div>
                    <p className="font-medium">
                      {leave.delegation.delegateToName}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {leave.delegation.delegateToEmail}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <div className="mb-2 text-sm text-zinc-500">
                      Responsibilities
                    </div>
                    <p className="text-zinc-900 dark:text-zinc-100">
                      {leave.delegation.responsibilities}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        leave.delegation.notified ? 'default' : 'secondary'
                      }
                    >
                      {leave.delegation.notified ? 'Notified' : 'Not Notified'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attachments Card */}
            {leave.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Attachments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leave.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-zinc-500" />
                          <div>
                            <p className="text-sm font-medium">
                              {attachment.fileName}
                            </p>
                            <p className="text-xs text-zinc-500">
                              Uploaded on{' '}
                              {format(attachment.uploadedAt, 'dd MMM yyyy')}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Approval History Card */}
            {leave.approvers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Approval History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leave.approvers.map((approver) => (
                      <div
                        key={approver.id}
                        className="border-l-2 border-zinc-200 pl-4"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <p className="font-medium">
                              {approver.employeeName}
                            </p>
                            <p className="text-sm text-zinc-500">
                              {approver.role}
                            </p>
                          </div>
                          {approver.approvedAt && (
                            <Badge className="bg-green-100 text-green-800">
                              Approved
                            </Badge>
                          )}
                          {approver.rejectedAt && (
                            <Badge className="bg-red-100 text-red-800">
                              Rejected
                            </Badge>
                          )}
                          {!approver.approvedAt && !approver.rejectedAt && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Pending
                            </Badge>
                          )}
                        </div>

                        {approver.comments && (
                          <div className="mt-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                            <p className="text-sm">{approver.comments}</p>
                          </div>
                        )}

                        {(approver.approvedAt || approver.rejectedAt) && (
                          <p className="mt-2 text-xs text-zinc-500">
                            {approver.approvedAt &&
                              `Approved on ${format(approver.approvedAt, 'dd MMM yyyy, hh:mm a')}`}
                            {approver.rejectedAt &&
                              `Rejected on ${format(approver.rejectedAt, 'dd MMM yyyy, hh:mm a')}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Employee Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Employee Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1 text-sm text-zinc-500">Name</div>
                  <p className="font-medium">{leave.employeeName}</p>
                </div>

                <Separator />

                <div>
                  <div className="mb-1 flex items-center gap-2 text-sm text-zinc-500">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                  <p className="text-sm">{leave.employeeEmail}</p>
                </div>

                <Separator />

                <div>
                  <div className="mb-1 flex items-center gap-2 text-sm text-zinc-500">
                    <Building className="h-4 w-4" />
                    Department
                  </div>
                  <p className="font-medium">{leave.department}</p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1 text-sm text-zinc-500">Applied On</div>
                  <p className="text-sm font-medium">
                    {format(leave.appliedAt, 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>

                <Separator />

                <div>
                  <div className="mb-1 text-sm text-zinc-500">Last Updated</div>
                  <p className="text-sm font-medium">
                    {format(leave.updatedAt, 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>

                {leave.cancelledAt && (
                  <>
                    <Separator />
                    <div>
                      <div className="mb-1 text-sm text-zinc-500">
                        Cancelled On
                      </div>
                      <p className="text-sm font-medium">
                        {format(leave.cancelledAt, 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                  </>
                )}

                {leave.withdrawnAt && (
                  <>
                    <Separator />
                    <div>
                      <div className="mb-1 text-sm text-zinc-500">
                        Withdrawn On
                      </div>
                      <p className="text-sm font-medium">
                        {format(leave.withdrawnAt, 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Escalate Dialog */}
        <Dialog open={escalateDialogOpen} onOpenChange={setEscalateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Escalate Leave Request</DialogTitle>
              <DialogDescription>
                Forward this leave request to a senior authority for review and
                decision.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Senior Authority Selection */}
              <div className="space-y-2">
                <Label htmlFor="seniorAuthority">
                  Senior Authority <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={escalateData.seniorAuthorityId}
                  onValueChange={(value) =>
                    setEscalateData((prev) => ({
                      ...prev,
                      seniorAuthorityId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select senior authority" />
                  </SelectTrigger>
                  <SelectContent>
                    {seniorAuthorities.map((authority) => (
                      <SelectItem
                        key={authority.employeeId}
                        value={authority.employeeId}
                      >
                        {authority.name} - {authority.designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Escalation Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Reason for Escalation <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why this request needs escalation..."
                  value={escalateData.reason}
                  onChange={(e) =>
                    setEscalateData((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEscalateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEscalate}>
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                Escalate Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
