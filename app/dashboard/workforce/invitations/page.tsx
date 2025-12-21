'use client';

import { useState } from 'react';
import { AppLayout, Pagination } from '@/components/common';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  Filter,
  Plus,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { mockInvitations } from '@/components/shared/mock-data';

// Extended mock data with additional fields for UI
const mockInvitationsExtended = mockInvitations.map((inv, index) => ({
  ...inv,
  employeeName: `Employee ${inv.employeeId}`,
  email: `${inv.employeeId.toLowerCase()}@echno.com`,
  phone: `+91-98765432${10 + index}`,
  createdDate: new Date(
    new Date(inv.joiningDate || new Date()).getTime() - 15 * 24 * 60 * 60 * 1000
  ),
  sentVia: ['email', 'whatsapp'] as string[],
  status: 'pending' as 'pending' | 'accepted' | 'rejected' | 'expired',
}));

// Update some to have different statuses for demo
if (mockInvitationsExtended.length > 1)
  mockInvitationsExtended[1].status = 'accepted';
if (mockInvitationsExtended.length > 2)
  mockInvitationsExtended[2].status = 'expired';

const getStatusBadge = (status: string) => {
  const config: Record<
    string,
    { label: string; className: string; icon: LucideIcon }
  > = {
    pending: {
      label: 'Pending',
      className:
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
      icon: Clock,
    },
    accepted: {
      label: 'Accepted',
      className:
        'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
      icon: CheckCircle,
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
      icon: XCircle,
    },
    expired: {
      label: 'Expired',
      className:
        'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
      icon: AlertCircle,
    },
  };

  const { label, className, icon: Icon } = config[status] || config.pending;
  return (
    <Badge className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  );
};

export default function InvitationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter invitations
  const filteredInvitations = mockInvitationsExtended.filter((inv) => {
    const matchesSearch =
      searchQuery === '' ||
      inv.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.inviteCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesDepartment =
      departmentFilter === 'all' || inv.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Calculate statistics
  const totalInvitations = mockInvitationsExtended.length;
  const pendingInvitations = mockInvitationsExtended.filter(
    (i) => i.status === 'pending'
  ).length;
  const acceptedInvitations = mockInvitationsExtended.filter(
    (i) => i.status === 'accepted'
  ).length;
  const expiredInvitations = mockInvitationsExtended.filter(
    (i) => i.status === 'expired'
  ).length;

  // Pagination
  const totalPages = Math.ceil(filteredInvitations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvitations = filteredInvitations.slice(startIndex, endIndex);

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Employee Invitations
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Manage and track employee invitation status
            </p>
          </div>
          <Link href="/dashboard/workforce/invitations/new">
            <Button className="mt-4 md:mt-0">
              <Plus className="mr-2 h-4 w-4" />
              Create Invitation
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Invitations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {totalInvitations}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {pendingInvitations}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Accepted</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {acceptedInvitations}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Expired</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <AlertCircle className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {expiredInvitations}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-zinc-400" />
                <Input
                  placeholder="Search by name, code, email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={departmentFilter}
                onValueChange={(value) => {
                  setDepartmentFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Quality">Quality</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                  <SelectItem value="Human Resources">
                    Human Resources
                  </SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table Header Info - Outside Card */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to{' '}
            {Math.min(endIndex, filteredInvitations.length)} of{' '}
            {filteredInvitations.length} invitation records
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Rows per page:
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(val) => setItemsPerPage(Number(val))}
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

        {/* Invitations Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-zinc-200 hover:bg-transparent dark:border-zinc-800">
                  <TableHead className="w-[50px]">
                    <input type="checkbox" className="rounded" />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentInvitations.length > 0 ? (
                  currentInvitations.map((invitation) => (
                    <TableRow
                      key={invitation.inviteCode}
                      className="border-b border-zinc-200 dark:border-zinc-800"
                    >
                      <TableCell>
                        <input type="checkbox" className="rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {invitation.employeeName}
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {invitation.employeeId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-zinc-900 dark:text-zinc-100">
                          {invitation.designation}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-zinc-900 dark:text-zinc-100">
                          <Clock className="h-4 w-4 text-green-600" />
                          {format(invitation.createdDate, 'HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-zinc-900 dark:text-zinc-100">
                          <Clock className="h-4 w-4 text-red-600" />
                          {invitation.expiryDate
                            ? format(invitation.expiryDate, 'HH:mm')
                            : '—'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`/dashboard/workforce/invitations/${invitation.inviteCode}`}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Invitation</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center">
                      <AlertCircle className="mx-auto mb-2 h-8 w-8 text-zinc-400" />
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        No invitations found
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination - Inside Card at bottom */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
