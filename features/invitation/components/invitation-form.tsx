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
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Save, QrCode, Copy, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/nav';
import { toast } from '@/lib/styles/toast-styles';
import type { Invitation } from '@/types/invitation';
import { useGenerateInviteCode } from '@/hooks/invitation';
import { useProjects } from '@/hooks/project';
import { InvitationQRCode } from './invitation-qr-code';

export function InvitationForm() {
  const generateMutation = useGenerateInviteCode();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();

  const [formData, setFormData] = useState({
    projectId: '',
    role: '',
    expiryDate: '',
    maxUsageCount: '',
  });

  const [generatedInvitation, setGeneratedInvitation] =
    useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteCode = generatedInvitation?.inviteCode ?? '';
  const isGenerated = !!generatedInvitation;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectId || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    generateMutation.mutate(
      {
        projectId: Number(formData.projectId),
        role: formData.role,
        expiryDate: formData.expiryDate
          ? new Date(formData.expiryDate)
          : undefined,
        maxUsageCount: formData.maxUsageCount
          ? Number(formData.maxUsageCount)
          : undefined,
      },
      {
        onSuccess: (invitation) => {
          setGeneratedInvitation(invitation);
        },
      }
    );
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

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Form Section */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Invite Code Details</CardTitle>
            <CardDescription>
              Generate an invite code for a project role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Project */}
              <div className="space-y-2">
                <Label htmlFor="projectId">
                  Project <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, projectId: value })
                  }
                  disabled={isGenerated}
                  required
                >
                  <SelectTrigger id="projectId">
                    <SelectValue
                      placeholder={
                        projectsLoading
                          ? 'Loading projects...'
                          : 'Select project'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.length === 0 && !projectsLoading && (
                      <SelectItem value="none" disabled>
                        No projects available
                      </SelectItem>
                    )}
                    {projects.map((project) => (
                      <SelectItem
                        key={project.id}
                        value={project.id.toString()}
                      >
                        {project.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                  disabled={isGenerated}
                  required
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROJECT_MEMBER">
                      Project Member
                    </SelectItem>
                    <SelectItem value="PROJECT_MANAGER">
                      Project Manager
                    </SelectItem>
                    <SelectItem value="PROJECT_VIEWER">
                      Project Viewer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Expiry + Max Uses */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                    disabled={isGenerated}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxUsageCount">Max Uses</Label>
                  <Input
                    id="maxUsageCount"
                    type="number"
                    min={1}
                    placeholder="Unlimited"
                    value={formData.maxUsageCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxUsageCount: e.target.value,
                      })
                    }
                    disabled={isGenerated}
                  />
                </div>
              </div>

              {!isGenerated && (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Generate Invite Code
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
                <CardTitle className="text-center">Invite Code</CardTitle>
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

                <div className="mt-4">
                  <InvitationQRCode
                    inviteCode={inviteCode}
                    size={256}
                    showDownload={true}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="border-t pt-4">
              <Button asChild variant="default" className="w-full">
                <Link href={routes.workforce.employees.invitations.href}>
                  <Save className="mr-2 h-4 w-4" />
                  Save & Go to Invitations
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Fill the form to generate an invite code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <QrCode className="mx-auto mb-4 h-16 w-16 text-zinc-300 dark:text-zinc-700" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Invite code will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
