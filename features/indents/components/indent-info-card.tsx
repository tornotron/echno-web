'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/alert-dialog';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useUpdateIndent } from '@/hooks/indents';
import { useProjects } from '@/hooks/project/use-projects';
import {
  IndentStatus,
  indentStatusLabels,
  indentStatusBadgeColors,
} from '@/types/indents';
import type { Indent } from '@/types/indents';

interface IndentInfoCardProps {
  indent: Indent;
}

export function IndentInfoCard({ indent }: IndentInfoCardProps) {
  const { data: projects = [] } = useProjects();
  const { mutateAsync: updateIndent, isPending: isUpdating } =
    useUpdateIndent();

  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [prevIndent, setPrevIndent] = useState(indent);
  const [form, setForm] = useState({
    indentNumber: indent.indentNumber,
    status: indent.status,
    expectedOn: indent.expectedOn
      ? new Date(indent.expectedOn).toISOString().split('T')[0]
      : '',
    projectId: indent.projectId ? String(indent.projectId) : '',
  });

  if (prevIndent !== indent) {
    setPrevIndent(indent);
    setForm({
      indentNumber: indent.indentNumber,
      status: indent.status,
      expectedOn: indent.expectedOn
        ? new Date(indent.expectedOn).toISOString().split('T')[0]
        : '',
      projectId: indent.projectId ? String(indent.projectId) : '',
    });
  }

  function handleCancel() {
    setIsEditing(false);
    setForm({
      indentNumber: indent.indentNumber,
      status: indent.status,
      expectedOn: indent.expectedOn
        ? new Date(indent.expectedOn).toISOString().split('T')[0]
        : '',
      projectId: indent.projectId ? String(indent.projectId) : '',
    });
  }

  async function handleConfirmSave() {
    try {
      await updateIndent({
        id: indent.id,
        dto: {
          indentNumber: form.indentNumber.trim(),
          status: form.status,
          expectedOn: form.expectedOn
            ? new Date(form.expectedOn).toISOString()
            : undefined,
          projectId: form.projectId ? Number(form.projectId) : undefined,
        },
      });
      setIsEditing(false);
    } catch {
      // handled by mutation hook
    }
  }

  return (
    <>
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Indent</AlertDialogTitle>
            <AlertDialogDescription>Save these changes?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSave}
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Indent Info</CardTitle>
            {isEditing ? (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                  onClick={() => setShowConfirm(true)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleCancel}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {isEditing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Indent Number</Label>
                <Input
                  value={form.indentNumber}
                  onChange={(e) =>
                    setForm({ ...form, indentNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as IndentStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(IndentStatus).map((s) => (
                      <SelectItem key={s} value={s}>
                        {indentStatusLabels[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Expected On</Label>
                <Input
                  type="date"
                  value={form.expectedOn}
                  onChange={(e) =>
                    setForm({ ...form, expectedOn: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Project</Label>
                <Select
                  value={form.projectId}
                  onValueChange={(v) => setForm({ ...form, projectId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Indent Number</span>
                <span className="font-medium">{indent.indentNumber}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Status</span>
                <Badge className={indentStatusBadgeColors[indent.status]}>
                  {indentStatusLabels[indent.status]}
                </Badge>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Created By</span>
                <span className="font-medium">{indent.createdBy.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Created At</span>
                <span className="font-medium">
                  {format(new Date(indent.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Expected On</span>
                <span className="font-medium">
                  {indent.expectedOn
                    ? format(new Date(indent.expectedOn), 'MMM dd, yyyy')
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project</span>
                <span className="font-medium">{indent.projectName ?? '—'}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
