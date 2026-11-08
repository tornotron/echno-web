'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import type { AccessRoleRequest } from '@tornotron/echno-core/access/types';

/** The backend's limit on a role name. */
export const ROLE_NAME_MAX = 120;

export interface RoleDetails {
  name: string;
  subtitle: string;
  description: string;
}

/** Trimmed, with blank optional fields left out. */
export function toRoleRequest(details: RoleDetails): AccessRoleRequest {
  return {
    name: details.name.trim(),
    subtitle: details.subtitle.trim() || undefined,
    description: details.description.trim() || undefined,
  };
}

interface RoleDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  initial: RoleDetails;
  pending: boolean;
  onSubmit: (details: RoleDetails) => void;
}

/** A role's name, function and description, for a new role, a copy, or a rename. */
export function RoleDetailsDialog(props: RoleDetailsDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Remounted on every open so the fields start from `initial`. */}
        {props.open && <RoleDetailsForm {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function RoleDetailsForm({
  onOpenChange,
  title,
  description,
  submitLabel,
  initial,
  pending,
  onSubmit,
}: RoleDetailsDialogProps) {
  const [details, setDetails] = useState(initial);
  const name = details.name.trim();
  const tooLong = name.length > ROLE_NAME_MAX;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name && !tooLong) onSubmit(details);
      }}
      className="space-y-4"
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <div className="space-y-1">
          <Label htmlFor="role-name" className="text-xs text-zinc-500">
            Role name
          </Label>
          <Input
            id="role-name"
            value={details.name}
            onChange={(e) => setDetails({ ...details, name: e.target.value })}
            placeholder="e.g. Planning Engineer"
            aria-invalid={tooLong || undefined}
            autoFocus
          />
          {tooLong && (
            <p className="text-xs text-red-600">
              Keep the name to {ROLE_NAME_MAX} characters.
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="role-subtitle" className="text-xs text-zinc-500">
            Function
          </Label>
          <Input
            id="role-subtitle"
            value={details.subtitle}
            onChange={(e) =>
              setDetails({ ...details, subtitle: e.target.value })
            }
            placeholder="e.g. Site Execution"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="role-description" className="text-xs text-zinc-500">
          Description
        </Label>
        <Textarea
          id="role-description"
          value={details.description}
          onChange={(e) =>
            setDetails({ ...details, description: e.target.value })
          }
          rows={2}
          placeholder="What this role is responsible for"
        />
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!name || tooLong || pending}>
          {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
