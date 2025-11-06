"use client"

import { use } from "react"
import { AppLayout } from "@/components/common"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
} from "lucide-react"
import { format } from "date-fns"
import { mockLeaveRequests } from "@/lib/mock-data"
import {
  getLeaveStatusLabel,
  getLeaveStatusColor,
  getLeaveTypeLabel,
  getLeaveTypeColor,
  LeaveStatus,
} from "@/types/leave"
import { notFound } from "next/navigation"

export default function LeaveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const leave = mockLeaveRequests.find((l) => l.id === id)

  if (!leave) {
    notFound()
  }

  const handleApprove = () => {
    console.log("Approving leave:", id)
    // TODO: Implement API call
  }

  const handleReject = () => {
    console.log("Rejecting leave:", id)
    // TODO: Implement API call
  }

  return (
    <AppLayout>
      <div className="px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Leave Request Details
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            ID: {leave.id}
          </p>
        </div>

        {leave.status === LeaveStatus.pending && (
          <div className="flex gap-2">
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
        <div className="md:col-span-2 space-y-6">
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
                  <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
                    <Calendar className="h-4 w-4" />
                    Leave Type
                  </div>
                  <Badge className={getLeaveTypeColor(leave.leaveType)}>
                    {getLeaveTypeLabel(leave.leaveType)}
                  </Badge>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
                    <Clock className="h-4 w-4" />
                    Duration
                  </div>
                  <p className="font-medium">{leave.daysCount} Days</p>
                </div>

                <div>
                  <div className="text-sm text-zinc-500 mb-1">From Date</div>
                  <p className="font-medium">
                    {format(leave.fromDate, "EEEE, dd MMMM yyyy")}
                  </p>
                </div>

                <div>
                  <div className="text-sm text-zinc-500 mb-1">To Date</div>
                  <p className="font-medium">
                    {format(leave.toDate, "EEEE, dd MMMM yyyy")}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
                  <FileText className="h-4 w-4" />
                  Reason for Leave
                </div>
                <p className="text-zinc-900 dark:text-zinc-100">{leave.reason}</p>
              </div>

              {leave.remarks && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-zinc-500 mb-2">Additional Remarks</div>
                    <p className="text-zinc-900 dark:text-zinc-100">{leave.remarks}</p>
                  </div>
                </>
              )}

              {leave.emergencyContact && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
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
                  <div className="text-sm text-zinc-500 mb-1">Delegated To</div>
                  <p className="font-medium">{leave.delegation.delegateToName}</p>
                  <p className="text-sm text-zinc-500">{leave.delegation.delegateToEmail}</p>
                </div>

                <Separator />

                <div>
                  <div className="text-sm text-zinc-500 mb-2">Responsibilities</div>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {leave.delegation.responsibilities}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={leave.delegation.notified ? "default" : "secondary"}>
                    {leave.delegation.notified ? "Notified" : "Not Notified"}
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
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-zinc-500" />
                        <div>
                          <p className="font-medium text-sm">{attachment.fileName}</p>
                          <p className="text-xs text-zinc-500">
                            Uploaded on {format(attachment.uploadedAt, "dd MMM yyyy")}
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
                    <div key={approver.id} className="border-l-2 border-zinc-200 pl-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{approver.employeeName}</p>
                          <p className="text-sm text-zinc-500">{approver.role}</p>
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
                        <div className="mt-2 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                          <p className="text-sm">{approver.comments}</p>
                        </div>
                      )}

                      {(approver.approvedAt || approver.rejectedAt) && (
                        <p className="text-xs text-zinc-500 mt-2">
                          {approver.approvedAt &&
                            `Approved on ${format(approver.approvedAt, "dd MMM yyyy, hh:mm a")}`}
                          {approver.rejectedAt &&
                            `Rejected on ${format(approver.rejectedAt, "dd MMM yyyy, hh:mm a")}`}
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
                <div className="text-sm text-zinc-500 mb-1">Name</div>
                <p className="font-medium">{leave.employeeName}</p>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
                <p className="text-sm">{leave.employeeEmail}</p>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
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
                <div className="text-sm text-zinc-500 mb-1">Applied On</div>
                <p className="text-sm font-medium">
                  {format(leave.appliedAt, "dd MMM yyyy, hh:mm a")}
                </p>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-zinc-500 mb-1">Last Updated</div>
                <p className="text-sm font-medium">
                  {format(leave.updatedAt, "dd MMM yyyy, hh:mm a")}
                </p>
              </div>

              {leave.cancelledAt && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-zinc-500 mb-1">Cancelled On</div>
                    <p className="text-sm font-medium">
                      {format(leave.cancelledAt, "dd MMM yyyy, hh:mm a")}
                    </p>
                  </div>
                </>
              )}

              {leave.withdrawnAt && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-zinc-500 mb-1">Withdrawn On</div>
                    <p className="text-sm font-medium">
                      {format(leave.withdrawnAt, "dd MMM yyyy, hh:mm a")}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </AppLayout>
  )
}
