'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UserPlus, Plus, X } from 'lucide-react';
import type { Member } from '@/types/member';
import type { Employee } from '@/types/employee';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TeamMembersSectionProps {
  selectedMembers: Member[];
  availableEmployees: Employee[];
  isDialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  onAddMember: (employee: Employee) => void;
  onRemoveMember: (memberEmail: string) => void;
}

export function TeamMembersSection({
  selectedMembers,
  availableEmployees,
  isDialogOpen,
  onDialogOpenChange,
  onAddMember,
  onRemoveMember,
}: TeamMembersSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Team Members</Label>
        <Dialog open={isDialogOpen} onOpenChange={onDialogOpenChange}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Team Members</DialogTitle>
              <DialogDescription>
                Select employees from your organization to add to this project
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {availableEmployees.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  All employees have been added to the team
                </p>
              ) : (
                availableEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="hover:bg-accent flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full font-semibold">
                        {employee.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {(employee as Employee).designation} •{' '}
                          {employee.department}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        onAddMember(employee);
                        onDialogOpenChange(false);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {selectedMembers.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No team members added yet
        </p>
      ) : (
        <div className="space-y-2">
          {selectedMembers.map((member) => (
            <div
              key={member.memberEmail}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full font-semibold">
                  {member.memberName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium">{member.memberName}</p>
                  <p className="text-muted-foreground text-sm">
                    {member.designation} • {member.department}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveMember(member.memberEmail)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
