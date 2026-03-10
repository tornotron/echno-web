'use client';

import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/common';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Invitation, getInvitationStatus } from '@/types/invitation/invitation';
import { useState } from 'react';
import { InvitationStatusBadge } from './invitation-status-badge';
import { InvitationAvatar } from './invitation-avatar';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
      aria-label={copied ? 'Copied' : 'Copy invite code'}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

interface InvitationTableProps {
  invitations: Invitation[];
  totalCount: number;
  startIndex: number;
  endIndex: number;
  itemsPerPage: number;
  onItemsPerPageChange: (n: number) => void;
  selectedInvitations: string[];
  isAllSelected: boolean;
  isSomeSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (inviteCode: string, checked: boolean) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function InvitationTable({
  invitations,
  totalCount,
  startIndex,
  endIndex,
  itemsPerPage,
  onItemsPerPageChange,
  selectedInvitations,
  isAllSelected,
  isSomeSelected,
  onSelectAll,
  onSelectOne,
  currentPage,
  totalPages,
  onPageChange,
}: InvitationTableProps) {
  const router = useRouter();

  return (
    <>
      {/* Row count + page size */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {totalCount === 0 ? 0 : startIndex + 1} to{' '}
          {Math.min(endIndex, totalCount)} of {totalCount} invitation records
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Rows per page:
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(val) => onItemsPerPageChange(Number(val))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile card grid */}
      <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:hidden">
        {invitations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-zinc-500">
              No invitation records found
            </CardContent>
          </Card>
        ) : (
          invitations.map((invitation) => (
            <Card
              key={invitation.inviteCode}
              className="cursor-pointer"
              onClick={() =>
                router.push(
                  `/users/dashboard/workforce/invitations/${invitation.inviteCode}`
                )
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center"
                    >
                      <Checkbox
                        checked={selectedInvitations.includes(
                          invitation.inviteCode
                        )}
                        onCheckedChange={(checked) =>
                          onSelectOne(invitation.inviteCode, checked as boolean)
                        }
                        aria-label={`Select ${invitation.employeeDetails.employeeName || 'invitation'}`}
                      />
                    </div>
                    <InvitationAvatar
                      name={invitation.employeeDetails.employeeName}
                    />
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {invitation.employeeDetails.employeeName || 'N/A'}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {invitation.inviteCode}
                      </div>
                    </div>
                  </div>
                  <InvitationStatusBadge
                    status={getInvitationStatus(invitation)}
                  />
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Designation
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {invitation.employeeDetails.designation}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Expires
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {invitation.expiryDate
                        ? format(invitation.expiryDate, 'MMM dd, yyyy')
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        {totalCount > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
      </div>

      {/* Desktop table */}
      <Card className="hidden lg:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-200 hover:bg-transparent dark:border-zinc-800">
                <TableHead className="w-[50px]">
                  {(() => {
                    const checkboxState = isAllSelected
                      ? true
                      : isSomeSelected
                        ? 'indeterminate'
                        : false;
                    return (
                      <Checkbox
                        checked={checkboxState}
                        onCheckedChange={onSelectAll}
                        aria-label="Select all"
                      />
                    );
                  })()}
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invite Code</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.length > 0 ? (
                invitations.map((invitation) => (
                  <TableRow
                    key={invitation.inviteCode}
                    className="hover:bg-muted/50 cursor-pointer border-b border-zinc-200 dark:border-zinc-800"
                    onClick={() =>
                      router.push(
                        `/users/dashboard/workforce/invitations/${invitation.inviteCode}`
                      )
                    }
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedInvitations.includes(
                          invitation.inviteCode
                        )}
                        onCheckedChange={(checked) =>
                          onSelectOne(invitation.inviteCode, checked as boolean)
                        }
                        aria-label={`Select ${invitation.employeeDetails.employeeName || 'invitation'}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <InvitationAvatar
                          name={invitation.employeeDetails.employeeName}
                        />
                        <div>
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {invitation.employeeDetails.employeeName || 'N/A'}
                          </div>
                          <div className="text-sm text-zinc-500 dark:text-zinc-400">
                            {invitation.employeeDetails.employeeId ||
                              'Not Assigned'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-zinc-900 dark:text-zinc-100">
                        {invitation.employeeDetails.designation}
                      </div>
                    </TableCell>
                    <TableCell>
                      <InvitationStatusBadge
                        status={getInvitationStatus(invitation)}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">
                          {invitation.inviteCode}
                        </span>
                        <CopyButton text={invitation.inviteCode} />
                      </div>
                    </TableCell>
                    <TableCell>
                      {invitation.expiryDate ? (
                        <>
                          <div className="text-sm text-zinc-900 dark:text-zinc-100">
                            {format(invitation.expiryDate, 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {format(invitation.expiryDate, 'h:mm a')}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-zinc-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <AlertCircle className="mx-auto mb-2 h-8 w-8 text-zinc-400" />
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      No invitations found
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </CardContent>
      </Card>
    </>
  );
}
