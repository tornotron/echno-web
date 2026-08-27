'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common/page-header';
import {
  Mail,
  MessageSquare,
  Printer,
  Copy,
  Check,
  Clock,
  CheckCircle,
  User,
  Building2,
  Briefcase,
  Phone,
  AtSign,
  Loader2,
} from 'lucide-react';
import { PhoneDisplay } from '@/components/shadcn/phone-input';
import { toast } from '@/lib/styles/toast-styles';
import {
  whatsappMessage,
  emailSubject,
  emailBody,
  getInvitationStatus,
} from '@tornotron/echno-core/invitation/types';
import { format } from 'date-fns';
import { useInvitationsByOrganization } from '@tornotron/echno-core/invitation/hooks';
import { useUser } from '@tornotron/echno-core/user/hooks';
import { useManagerName } from '@tornotron/echno-core/employee/hooks';
import { useShifts } from '@tornotron/echno-core/shift-timing/hooks';
import { InvitationQRCode, InvitationStatusBadge } from '@/features/invitation';
import { InvitationErrorState } from '@/features/invitation/components/invitation-error-state';

export default function InvitationPage() {
  const params = useParams();
  const [copied, setCopied] = useState(false);

  // Get user and their organization
  const { data: user } = useUser();

  // Get all invitations for the organization
  const {
    data: invitations,
    isLoading,
    error,
  } = useInvitationsByOrganization(user?.defaultOrganizationId);

  // Find the specific invitation by code from URL params
  const inviteCode = params.id as string;
  const invitation = invitations?.find((inv) => inv.inviteCode === inviteCode);

  // Resolve manager name from ID
  const managerName = useManagerName(invitation?.employeeDetails.managerId);

  // Resolve the assigned shift-timing id to a human label
  const { data: shifts = [] } = useShifts();
  const shiftTimingId = invitation?.employeeDetails.shiftTimingId;
  const assignedShift =
    shiftTimingId == null
      ? undefined
      : shifts.find((shift) => shift.id === shiftTimingId);
  const shiftTimingLabel = assignedShift
    ? `${assignedShift.shiftName} (${assignedShift.startTime} - ${assignedShift.endTime})`
    : null;

  // Show loading state
  if (isLoading || !user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // If invitation not found, show error
  if (error || !invitation) {
    return <InvitationErrorState inviteCode={inviteCode} />;
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Send via WhatsApp
  const sendViaWhatsApp = () => {
    const message = whatsappMessage(invitation, invitation.organizationName);
    const phone =
      invitation.employeeDetails.phone?.replaceAll(/[^0-9]/g, '') || '';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('Opening WhatsApp...');
  };

  // Send via Email
  const sendViaEmail = () => {
    const subject = emailSubject(invitation, invitation.organizationName);
    const body = emailBody(invitation, invitation.organizationName);
    const url = `mailto:${invitation.employeeDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.click();
    toast.success('Opening email client...');
  };

  // Send via Slack
  const sendViaSlack = () => {
    const message = whatsappMessage(invitation, invitation.organizationName);
    copyToClipboard(message);
    toast.success('Message copied! Paste it in Slack', {
      description: 'Open Slack and paste the invitation message',
    });
  };

  // Send via Discord
  const sendViaDiscord = () => {
    const message = whatsappMessage(invitation, invitation.organizationName);
    copyToClipboard(message);
    toast.success('Message copied! Paste it in Discord', {
      description: 'Open Discord and paste the invitation message',
    });
  };

  // Print invitation
  const printInvitation = () => {
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      const content = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Employee Invitation - ${invitation.inviteCode}</title>
          <style>
            @page { margin: 2cm; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #2563eb;
              margin: 0 0 10px 0;
              font-size: 28px;
            }
            .header p {
              color: #666;
              margin: 0;
              font-size: 14px;
            }
            .invite-code {
              background: #f3f4f6;
              border: 2px dashed #2563eb;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
              border-radius: 8px;
            }
            .invite-code .label {
              font-size: 14px;
              color: #666;
              margin-bottom: 8px;
            }
            .invite-code .code {
              font-size: 32px;
              font-weight: bold;
              color: #2563eb;
              letter-spacing: 2px;
              font-family: 'Courier New', monospace;
            }
            .details {
              margin: 30px 0;
            }
            .details h2 {
              color: #2563eb;
              font-size: 18px;
              margin-bottom: 20px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 10px;
            }
            .detail-row {
              display: flex;
              margin-bottom: 12px;
              padding: 8px 0;
            }
            .detail-row .label {
              font-weight: 600;
              width: 180px;
              color: #555;
            }
            .detail-row .value {
              flex: 1;
              color: #333;
            }
            .instructions {
              background: #f9fafb;
              border-left: 4px solid #2563eb;
              padding: 20px;
              margin: 30px 0;
            }
            .instructions h3 {
              margin-top: 0;
              color: #2563eb;
              font-size: 16px;
            }
            .instructions ol {
              margin: 10px 0 0 0;
              padding-left: 20px;
            }
            .instructions li {
              margin-bottom: 8px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #666;
              font-size: 14px;
            }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${invitation.organizationName || 'Organization'}</h1>
            <p>Employee Invitation Letter</p>
          </div>

          <p>Dear ${invitation.employeeDetails.employeeName || 'Candidate'},</p>

          <p>We are pleased to invite you to join <strong>${invitation.organizationName || 'our organization'}</strong> as a <strong>${invitation.employeeDetails.designation}</strong> in our <strong>${invitation.employeeDetails.department}</strong> department.</p>

          <div class="invite-code">
            <div class="label">Your Invitation Code</div>
            <div class="code">${invitation.inviteCode}</div>
          </div>

          <div class="details">
            <h2>Employment Details</h2>
            ${
              invitation.employeeDetails.employeeId
                ? `
            <div class="detail-row">
              <div class="label">Employee ID:</div>
              <div class="value">${invitation.employeeDetails.employeeId}</div>
            </div>`
                : ''
            }
            <div class="detail-row">
              <div class="label">Position:</div>
              <div class="value">${invitation.employeeDetails.designation}</div>
            </div>
            <div class="detail-row">
              <div class="label">Department:</div>
              <div class="value">${invitation.employeeDetails.department}</div>
            </div>
            ${
              invitation.employeeDetails.joiningDate
                ? `
            <div class="detail-row">
              <div class="label">Start Date:</div>
              <div class="value">${format(invitation.employeeDetails.joiningDate, 'dd/MM/yyyy')}</div>
            </div>`
                : ''
            }
            ${
              shiftTimingLabel
                ? `
            <div class="detail-row">
              <div class="label">Shift Timing:</div>
              <div class="value">${shiftTimingLabel}</div>
            </div>`
                : ''
            }
            ${
              managerName
                ? `
            <div class="detail-row">
              <div class="label">Reporting Manager:</div>
              <div class="value">${managerName}</div>
            </div>`
                : ''
            }
            <div class="detail-row">
              <div class="label">Invitation Valid Until:</div>
              <div class="value">${invitation.expiryDate ? format(invitation.expiryDate, 'dd/MM/yyyy') : 'N/A'}</div>
            </div>
          </div>

          <div class="instructions">
            <h3>How to Join</h3>
            <ol>
              <li>Download the <strong>Echno Attendance</strong> mobile app from Google Play Store or Apple App Store</li>
              <li>Open the app and select <strong>"Join with Invite Code"</strong></li>
              <li>Enter your invitation code: <strong>${invitation.inviteCode}</strong></li>
              <li>Complete your profile setup and verification</li>
              <li>Start your journey with us!</li>
            </ol>
          </div>

          <p>We look forward to welcoming you to our team. If you have any questions, please don't hesitate to contact our HR department.</p>

          <div class="footer">
            <p><strong>${invitation.organizationName || 'Organization'}</strong></p>
            <p>This is a system-generated invitation letter.</p>
            <p>Generated on ${format(new Date(), 'dd/MM/yyyy')}</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
      }, 250);

      toast.success('Opening print dialog...');
    }
  };

  const currentStatus = getInvitationStatus(invitation);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <PageHeader
        title="Invitation Details"
        badge={<InvitationStatusBadge status={currentStatus} />}
        description={invitation.inviteCode}
        className="mb-8"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Employee Information */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Full Name
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {invitation.employeeDetails.employeeName || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Employee ID
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {invitation.employeeDetails.employeeId || 'Not Assigned'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                    <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Department
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {invitation.employeeDetails.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                    <Briefcase className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Designation
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {invitation.employeeDetails.designation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/20">
                    <AtSign className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Email
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {invitation.employeeDetails.email || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/20">
                    <Phone className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Phone
                    </p>
                    <PhoneDisplay
                      value={invitation.employeeDetails.phone}
                      asLink
                      numberClassName="font-medium text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {invitation.employeeDetails.joiningDate && (
                  <div>
                    <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Joining Date
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {format(
                        invitation.employeeDetails.joiningDate,
                        'MMM dd, yyyy'
                      )}
                    </p>
                  </div>
                )}

                {invitation.employeeDetails.salary && (
                  <div>
                    <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Salary
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      ₹{invitation.employeeDetails.salary.toLocaleString()}
                    </p>
                  </div>
                )}

                {shiftTimingLabel && (
                  <div>
                    <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Shift Timing
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {shiftTimingLabel}
                    </p>
                  </div>
                )}

                {managerName && (
                  <div>
                    <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Reporting Manager
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {managerName}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Invitation Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Invitation Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Expires
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {invitation.expiryDate
                        ? format(
                            invitation.expiryDate,
                            "MMM dd, yyyy 'at' h:mm a"
                          )
                        : 'Never'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                    <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Max Uses
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {invitation.maxUses || 'Unlimited'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Current Uses
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {invitation.usedCount} / {invitation.maxUses || '∞'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          {/* Invite Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Invitation Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-zinc-100 p-6 text-center dark:bg-zinc-800">
                <div className="mb-4 font-mono text-2xl font-bold tracking-wider text-blue-600 dark:text-blue-400">
                  {invitation.inviteCode}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(invitation.inviteCode)}
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>

              {/* QR Code */}
              <div className="mt-4">
                <InvitationQRCode
                  inviteCode={invitation.inviteCode}
                  organizationName={invitation.organizationName}
                  size={256}
                  showDownload={true}
                />
              </div>
            </CardContent>
          </Card>

          {/* Share Options Card */}
          <Card>
            <CardHeader>
              <CardTitle>Share Invitation</CardTitle>
              <CardDescription>Send the invitation again</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={sendViaWhatsApp}
              >
                <MessageSquare className="mr-2 h-4 w-4 text-green-600" />
                Send via WhatsApp
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={sendViaEmail}
              >
                <Mail className="mr-2 h-4 w-4 text-blue-600" />
                Send via Email
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={sendViaSlack}
              >
                <MessageSquare className="mr-2 h-4 w-4 text-purple-600" />
                Copy for Slack
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={sendViaDiscord}
              >
                <MessageSquare className="mr-2 h-4 w-4 text-indigo-600" />
                Copy for Discord
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={printInvitation}
              >
                <Printer className="mr-2 h-4 w-4 text-zinc-600" />
                Print Invitation Letter
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
