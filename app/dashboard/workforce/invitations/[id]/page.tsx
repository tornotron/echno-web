'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/common';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Printer,
  QrCode,
  Copy,
  Check,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  Building2,
  Briefcase,
  Phone,
  AtSign,
  LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { whatsappMessage, emailSubject, emailBody } from '@/types/invitation';
import type { Invitation } from '@/types/invitation';
import { EmployeeStatus } from '@/types/employee';
import { format } from 'date-fns';

// Mock invitation data (in real app, fetch from API)
const mockInvitation: Invitation & {
  employeeName: string;
  email: string;
  phone: string;
  createdDate: Date;
  sentVia: string[];
} = {
  inviteCode: 'INV-2025-001',
  employeeId: 'EMP-2025-101',
  employeeName: 'Arjun Mehta',
  designation: 'Senior Engineer',
  department: 'Engineering',
  organizationId: 'ORG-001',
  organizationName: 'Echno Construction',
  status: EmployeeStatus.active,
  joiningDate: new Date('2025-02-01'),
  salary: 75_000,
  reportingManager: 'Rajesh Kumar',
  shiftTiming: '9:00 AM - 6:00 PM',
  validityDays: 30,
  expiryDate: new Date('2025-02-15'),
  createdDate: new Date('2025-01-15'),
  sentVia: ['email', 'whatsapp'],
  email: 'arjun.mehta@email.com',
  phone: '+91-9876543210',
};

 
export default function InvitationPage() {
  const [copied, setCopied] = useState(false);
  const invitation = mockInvitation; // In real app: fetch based on params.id

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Send via WhatsApp
  const sendViaWhatsApp = () => {
    const message = whatsappMessage(invitation);
    const phone = invitation.phone.replaceAll(/[^0-9]/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('Opening WhatsApp...');
  };

  // Send via Email
  const sendViaEmail = () => {
    const subject = emailSubject(invitation);
    const body = emailBody(invitation);
    const url = `mailto:${invitation.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    globalThis.location.href = url;
    toast.success('Opening email client...');
  };

  // Send via Slack
  const sendViaSlack = () => {
    const message = whatsappMessage(invitation);
    copyToClipboard(message);
    toast.success('Message copied! Paste it in Slack', {
      description: 'Open Slack and paste the invitation message',
    });
  };

  // Send via Discord
  const sendViaDiscord = () => {
    const message = whatsappMessage(invitation);
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
            <h1>${invitation.organizationName}</h1>
            <p>Employee Invitation Letter</p>
          </div>

          <p>Dear ${invitation.employeeName},</p>
          
          <p>We are pleased to invite you to join <strong>${invitation.organizationName}</strong> as a <strong>${invitation.designation}</strong> in our <strong>${invitation.department}</strong> department.</p>

          <div class="invite-code">
            <div class="label">Your Invitation Code</div>
            <div class="code">${invitation.inviteCode}</div>
          </div>

          <div class="details">
            <h2>Employment Details</h2>
            <div class="detail-row">
              <div class="label">Employee ID:</div>
              <div class="value">${invitation.employeeId}</div>
            </div>
            <div class="detail-row">
              <div class="label">Position:</div>
              <div class="value">${invitation.designation}</div>
            </div>
            <div class="detail-row">
              <div class="label">Department:</div>
              <div class="value">${invitation.department}</div>
            </div>
            ${
              invitation.joiningDate
                ? `
            <div class="detail-row">
              <div class="label">Start Date:</div>
              <div class="value">${format(invitation.joiningDate, 'dd/MM/yyyy')}</div>
            </div>`
                : ''
            }
            ${
              invitation.reportingManager
                ? `
            <div class="detail-row">
              <div class="label">Reporting Manager:</div>
              <div class="value">${invitation.reportingManager}</div>
            </div>`
                : ''
            }
            ${
              invitation.shiftTiming
                ? `
            <div class="detail-row">
              <div class="label">Shift Timing:</div>
              <div class="value">${invitation.shiftTiming}</div>
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
            <p><strong>${invitation.organizationName}</strong></p>
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

  // Determine status display
  const getStatusDisplay = () => {
    const now = new Date();
    const isExpired = invitation.expiryDate && now > invitation.expiryDate;

    if (isExpired) {
      return {
        label: 'Expired',
        icon: AlertCircle,
        className:
          'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
      };
    }

    // You can expand this with actual status from backend
    const statusMap: Record<
      string,
      { label: string; icon: LucideIcon; className: string }
    > = {
      pending: {
        label: 'Pending',
        icon: Clock,
        className:
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
      },
      accepted: {
        label: 'Accepted',
        icon: CheckCircle,
        className:
          'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
      },
      rejected: {
        label: 'Rejected',
        icon: XCircle,
        className:
          'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
      },
    };

    return statusMap.pending; // Default to pending for this mock
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/workforce/invitations">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Invitation Details
              </h1>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                {invitation.inviteCode}
              </p>
            </div>
          </div>
          <Badge className={statusDisplay.className}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {statusDisplay.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Employee Information */}
            <Card>
              <CardHeader>
                <CardTitle>Employee Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Full Name
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {invitation.employeeName}
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
                        {invitation.employeeId}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                      <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Department
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {invitation.department}
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
                        {invitation.designation}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/20">
                      <AtSign className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Email
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {invitation.email}
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
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {invitation.phone}
                      </p>
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
                <div className="grid grid-cols-2 gap-6">
                  {invitation.joiningDate && (
                    <div>
                      <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Joining Date
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {format(invitation.joiningDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}

                  {invitation.salary && (
                    <div>
                      <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Salary
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        ₹{invitation.salary.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {invitation.reportingManager && (
                    <div>
                      <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Reporting Manager
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {invitation.reportingManager}
                      </p>
                    </div>
                  )}

                  {invitation.shiftTiming && (
                    <div>
                      <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Shift Timing
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {invitation.shiftTiming}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Invitation Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Invitation Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Created
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {format(
                          invitation.createdDate,
                          "MMM dd, yyyy 'at' h:mm a"
                        )}
                      </p>
                    </div>
                  </div>

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
                      <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Sent Via
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {invitation.sentVia.map((method) => (
                          <Badge
                            key={method}
                            variant="outline"
                            className="text-xs"
                          >
                            {method.charAt(0).toUpperCase() + method.slice(1)}
                          </Badge>
                        ))}
                      </div>
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

                {/* QR Code Placeholder */}
                <div className="mt-4 rounded-lg border-2 border-dashed border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="flex aspect-square items-center justify-center">
                    <QrCode className="h-32 w-32 text-zinc-400 dark:text-zinc-600" />
                  </div>
                  <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
                    QR Code (Scan with mobile app)
                  </p>
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
    </AppLayout>
  );
}
