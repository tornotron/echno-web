'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { PhoneInput } from '@/components/shadcn/phone-input';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Save,
  Mail,
  MessageSquare,
  Printer,
  QrCode,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/nav';
import { toast } from '@/lib/styles/toast-styles';
import {
  Department,
  getDepartmentLabel,
} from '@tornotron/echno-core/employee/types';
import {
  whatsappMessage,
  emailSubject,
  emailBody,
} from '@tornotron/echno-core/invitation/types';
import type { Invitation } from '@tornotron/echno-core/invitation/types';
import { useGenerateInviteCode } from '@tornotron/echno-core/invitation/hooks';
import { useUser } from '@tornotron/echno-core/user/hooks';
import { useManagers } from '@tornotron/echno-core/employee/hooks';
import { useShifts } from '@tornotron/echno-core/shift-timing/hooks';
import { InvitationQRCode } from './invitation-qr-code';

// Sentinel Select value for "no shift assigned" (shadcn Select forbids an
// empty-string item value).
const UNASSIGNED_SHIFT = 'unassigned';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#x27;');
}

export function InvitationForm() {
  const { data: user } = useUser();
  const generateMutation = useGenerateInviteCode();
  const { data: managers = [], isLoading: managersLoading } = useManagers();
  const { data: shifts = [] } = useShifts();

  // Resolves a shift-timing id to a human label for print/share output.
  const shiftLabel = (id?: number | null): string | null => {
    if (id == null) return null;
    const shift = shifts.find((s) => s.id === id);
    return shift
      ? `${shift.shiftName} (${shift.startTime} - ${shift.endTime})`
      : null;
  };

  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    joiningDate: '',
    salary: '',
    managerId: '',
    shiftTimingId: '',
    validityDays: '30',
  });

  const [generatedInvitation, setGeneratedInvitation] =
    useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteCode = generatedInvitation?.inviteCode || '';
  const isGenerated = !!generatedInvitation;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId || !formData.designation || !formData.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.email && !formData.phone) {
      toast.error('Please provide either email or phone number');
      return;
    }

    if (!user?.defaultOrganizationId) {
      toast.error(
        'No organization selected. Please select an organization first.'
      );
      return;
    }

    generateMutation.mutate(
      {
        organizationId: user.defaultOrganizationId,
        request: {
          designation: formData.designation,
          department: formData.department,
          employeeId: formData.employeeId,
          employeeName: formData.employeeName || undefined,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          joiningDate: formData.joiningDate
            ? new Date(formData.joiningDate)
            : undefined,
          salary: formData.salary
            ? Number.parseFloat(formData.salary)
            : undefined,
          managerId: formData.managerId
            ? Number.parseInt(formData.managerId, 10)
            : undefined,
          shiftTimingId: formData.shiftTimingId
            ? Number.parseInt(formData.shiftTimingId, 10)
            : undefined,
          validityDays: Number.parseInt(formData.validityDays),
        },
      },
      {
        onSuccess: (invitation) => {
          setGeneratedInvitation(invitation);
          toast.success('Invitation Generated', {
            description: `Code: ${invitation.inviteCode}. Valid for ${formData.validityDays} days.`,
          });
        },
        onError: (error) => {
          toast.error('Failed to Generate Invitation', {
            description:
              error instanceof Error ? error.message : 'Please try again.',
          });
        },
      }
    );
  };

  const getInvitation = (): Invitation => {
    if (generatedInvitation) {
      return generatedInvitation;
    }

    const expiryDate = new Date();
    expiryDate.setDate(
      expiryDate.getDate() + Number.parseInt(formData.validityDays)
    );

    return {
      inviteCode,
      usedCount: 0,
      isActive: true,
      employeeDetails: {
        employeeId: formData.employeeId,
        employeeName: formData.employeeName || undefined,
        designation: formData.designation,
        department: formData.department,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        joiningDate: formData.joiningDate
          ? new Date(formData.joiningDate)
          : undefined,
        salary: formData.salary
          ? Number.parseFloat(formData.salary)
          : undefined,
        managerId: formData.managerId
          ? Number.parseInt(formData.managerId, 10)
          : undefined,
        shiftTimingId: formData.shiftTimingId
          ? Number.parseInt(formData.shiftTimingId, 10)
          : undefined,
        status: 'active',
      },
      organizationId: user?.defaultOrganizationId || 0,
      organizationName: undefined,
      maxUses: undefined,
      expiryDate,
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((error) => {
        setCopied(false);
        toast.error('Failed to copy');
        console.error('clipboard write failed:', error);
      });
  };

  const sendViaWhatsApp = () => {
    const invitation = getInvitation();
    const message = whatsappMessage(invitation);
    const phone = formData.phone.replaceAll(/[^0-9]/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('Opening WhatsApp...');
  };

  const sendViaEmail = () => {
    const invitation = getInvitation();
    const subject = emailSubject(invitation);
    const body = emailBody(invitation);
    const url = `mailto:${formData.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    globalThis.location.href = url;
    toast.success('Opening email client...');
  };

  const sendViaSlack = () => {
    const invitation = getInvitation();
    const message = whatsappMessage(invitation);
    copyToClipboard(message);
    toast.success('Message copied! Paste it in Slack', {
      description: 'Open Slack and paste the invitation message',
    });
  };

  const sendViaDiscord = () => {
    const invitation = getInvitation();
    const message = whatsappMessage(invitation);
    copyToClipboard(message);
    toast.success('Message copied! Paste it in Discord', {
      description: 'Open Discord and paste the invitation message',
    });
  };

  const printInvitation = () => {
    const invitation = getInvitation();
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      const e = escapeHtml;
      const orgName = e(invitation.organizationName);
      const employeeName = e(formData.employeeName);
      const inviteCode = e(invitation.inviteCode);
      const designation = e(invitation.employeeDetails.designation);
      const department = e(invitation.employeeDetails.department);
      const employeeId = e(invitation.employeeDetails.employeeId);
      const resolvedShift = shiftLabel(
        invitation.employeeDetails.shiftTimingId
      );
      const shiftTiming = resolvedShift ? e(resolvedShift) : null;
      const _jd = invitation.employeeDetails.joiningDate
        ? new Date(invitation.employeeDetails.joiningDate)
        : null;
      const joiningDate =
        _jd && !Number.isNaN(_jd.getTime())
          ? e(_jd.toLocaleDateString('en-GB'))
          : null;
      const _ed = invitation.expiryDate
        ? new Date(invitation.expiryDate)
        : null;
      const expiryDate =
        _ed && !Number.isNaN(_ed.getTime())
          ? e(_ed.toLocaleDateString('en-GB'))
          : null;
      const generatedOn = e(new Date().toLocaleDateString('en-GB'));

      const content = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Employee Invitation - ${inviteCode}</title>
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
            <h1>${orgName}</h1>
            <p>Employee Invitation Letter</p>
          </div>

          <p>Dear ${employeeName},</p>

          <p>We are pleased to invite you to join <strong>${orgName}</strong> as a <strong>${designation}</strong> in our <strong>${department}</strong> department.</p>

          <div class="invite-code">
            <div class="label">Your Invitation Code</div>
            <div class="code">${inviteCode}</div>
          </div>

          <div class="details">
            <h2>Employment Details</h2>
            <div class="detail-row">
              <div class="label">Employee ID:</div>
              <div class="value">${employeeId}</div>
            </div>
            <div class="detail-row">
              <div class="label">Position:</div>
              <div class="value">${designation}</div>
            </div>
            <div class="detail-row">
              <div class="label">Department:</div>
              <div class="value">${department}</div>
            </div>
            ${
              joiningDate
                ? `
            <div class="detail-row">
              <div class="label">Start Date:</div>
              <div class="value">${joiningDate}</div>
            </div>`
                : ''
            }
            ${
              shiftTiming
                ? `
            <div class="detail-row">
              <div class="label">Shift Timing:</div>
              <div class="value">${shiftTiming}</div>
            </div>`
                : ''
            }
            <div class="detail-row">
              <div class="label">Invitation Valid Until:</div>
              <div class="value">${expiryDate}</div>
            </div>
          </div>

          <div class="instructions">
            <h3>How to Join</h3>
            <ol>
              <li>Download the <strong>Echno Attendance</strong> mobile app from Google Play Store or Apple App Store</li>
              <li>Open the app and select <strong>&ldquo;Join with Invite Code&rdquo;</strong></li>
              <li>Enter your invitation code: <strong>${inviteCode}</strong></li>
              <li>Complete your profile setup and verification</li>
              <li>Start your journey with us!</li>
            </ol>
          </div>

          <p>We look forward to welcoming you to our team. If you have any questions, please don&rsquo;t hesitate to contact our HR department.</p>

          <div class="footer">
            <p><strong>${orgName}</strong></p>
            <p>This is a system-generated invitation letter.</p>
            <p>Generated on ${generatedOn}</p>
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

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Form Section */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
            <CardDescription>
              Fill in the employee details to generate an invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">
                    Employee ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="employeeId"
                    placeholder="e.g., EMP-2025-001"
                    value={formData.employeeId}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeId: e.target.value })
                    }
                    disabled={isGenerated}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeeName">Full Name</Label>
                  <Input
                    id="employeeName"
                    placeholder="e.g., John Doe"
                    value={formData.employeeName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employeeName: e.target.value,
                      })
                    }
                    disabled={isGenerated}
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={isGenerated}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <PhoneInput
                    id="phone"
                    value={formData.phone}
                    onChange={(value) =>
                      setFormData({ ...formData, phone: value || '' })
                    }
                    disabled={isGenerated}
                  />
                </div>
              </div>

              {/* Position Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="designation">
                    Designation <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="designation"
                    placeholder="e.g., Senior Engineer"
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        designation: e.target.value,
                      })
                    }
                    disabled={isGenerated}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">
                    Department <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) =>
                      setFormData({ ...formData, department: value })
                    }
                    disabled={isGenerated}
                    required
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Department).map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {getDepartmentLabel(dept)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Employment Details */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="joiningDate">Joining Date</Label>
                  <Input
                    id="joiningDate"
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        joiningDate: e.target.value,
                      })
                    }
                    disabled={isGenerated}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary">Salary (₹)</Label>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="e.g., 50000"
                    value={formData.salary}
                    onChange={(e) =>
                      setFormData({ ...formData, salary: e.target.value })
                    }
                    disabled={isGenerated}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="managerId">Reporting Manager</Label>
                  <Select
                    value={formData.managerId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, managerId: value })
                    }
                    disabled={isGenerated}
                  >
                    <SelectTrigger id="managerId">
                      <SelectValue
                        placeholder={
                          managersLoading
                            ? 'Loading managers...'
                            : 'Select manager (optional)'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.length === 0 && !managersLoading && (
                        <SelectItem value="none" disabled>
                          No managers available
                        </SelectItem>
                      )}
                      {managers.map((manager) => (
                        <SelectItem
                          key={manager.id!}
                          value={manager.id!.toString()}
                        >
                          {manager.name} - {manager.designation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shiftTiming">Shift Timing</Label>
                  <Select
                    value={formData.shiftTimingId || UNASSIGNED_SHIFT}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        shiftTimingId: value === UNASSIGNED_SHIFT ? '' : value,
                      })
                    }
                    disabled={isGenerated}
                  >
                    <SelectTrigger id="shiftTiming">
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED_SHIFT}>
                        Unassigned
                      </SelectItem>
                      {shifts.map((shift) => (
                        <SelectItem key={shift.id} value={String(shift.id)}>
                          {shift.shiftName} ({shift.startTime} - {shift.endTime}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Validity */}
              <div className="space-y-2">
                <Label htmlFor="validityDays">Invitation Validity (Days)</Label>
                <Select
                  value={formData.validityDays}
                  onValueChange={(value) =>
                    setFormData({ ...formData, validityDays: value })
                  }
                  disabled={isGenerated}
                >
                  <SelectTrigger id="validityDays">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="15">15 days</SelectItem>
                    <SelectItem value="30">30 days (Recommended)</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              {!isGenerated && (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    generateMutation.isPending || !user?.defaultOrganizationId
                  }
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Generate Invitation
                    </>
                  )}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Preview/Actions Section */}
      <div className="lg:col-span-1">
        {isGenerated ? (
          <>
            {/* Invite Code Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-center">Invitation Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-zinc-100 p-6 text-center dark:bg-zinc-800">
                  <div className="mb-4 font-mono text-2xl font-bold tracking-wider text-blue-600 dark:text-blue-400">
                    {inviteCode}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(inviteCode)}
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
                    inviteCode={inviteCode}
                    organizationName={
                      user?.defaultOrganizationId
                        ? 'Your Organization'
                        : undefined
                    }
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
                <CardDescription>
                  Send the invitation to the employee
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {formData.phone && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={sendViaWhatsApp}
                  >
                    <MessageSquare className="mr-2 h-4 w-4 text-green-600" />
                    Send via WhatsApp
                  </Button>
                )}

                {formData.email && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={sendViaEmail}
                  >
                    <Mail className="mr-2 h-4 w-4 text-blue-600" />
                    Send via Email
                  </Button>
                )}

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

                <div className="border-t pt-4">
                  <Button asChild variant="default" className="w-full">
                    <Link href={routes.workforce.employees.invitations.href}>
                      <Save className="mr-2 h-4 w-4" />
                      Save & Go to Invitations
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Fill the form to generate invitation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <QrCode className="mx-auto mb-4 h-16 w-16 text-zinc-300 dark:text-zinc-700" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Invitation code will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
