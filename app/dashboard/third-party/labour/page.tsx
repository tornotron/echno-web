'use client';

import { useState } from 'react';
import { AppLayout, Pagination, SearchAndFilter } from '@/components/common';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HardHat,
  Plus,
  User,
  Download,
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  Edit,
} from 'lucide-react';

import Link from 'next/link';
import { mockLabour } from '@/components/shared/mock-data';

const typeLabels = {
  daily: 'Daily Wage',
  monthly: 'Monthly',
  contract: 'Contract',
  piece: 'Piece Rate',
};

const statusColors = {
  active: 'green',
  inactive: 'zinc',
  onLeave: 'orange',
  terminated: 'red',
};

const statusLabels = {
  active: 'Active',
  inactive: 'Inactive',
  onLeave: 'On Leave',
  terminated: 'Terminated',
};

const skillLevelLabels = {
  unskilled: 'Unskilled',
  semiskilled: 'Semi-Skilled',
  skilled: 'Skilled',
  highlySkilled: 'Highly Skilled',
};

export default function LabourPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const hasActiveFilters = Boolean(
    statusFilter !== 'all' || typeFilter !== 'all' || searchQuery !== ''
  );

  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setSearchQuery('');
  };

  // Filter data
  const filteredLabour = mockLabour.filter((labour) => {
    const matchesSearch =
      labour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      labour.labourId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      labour.trade.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || labour.status === statusFilter;
    const matchesType = typeFilter === 'all' || labour.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLabour.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLabour = filteredLabour.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedLabour.map((l) => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const isAllSelected =
    paginatedLabour.length > 0 && selectedIds.length === paginatedLabour.length;
  const isSomeSelected =
    selectedIds.length > 0 && selectedIds.length < paginatedLabour.length;

  // Statistics
  const stats = {
    total: mockLabour.length,
    active: mockLabour.filter((l) => l.status === 'active').length,
    totalDue: mockLabour.reduce((sum, l) => sum + (l.totalDue || 0), 0),
    onLeave: mockLabour.filter((l) => l.status === 'onLeave').length,
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center space-x-3 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              <HardHat className="h-8 w-8" />
              <span>Labour Management</span>
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Manage daily wage workers and contract labour
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/third-party/labour/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Labour
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Labour</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.total}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                Registered workers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Workers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                  <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.active}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                Currently working
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Outstanding</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                  <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  ₹{stats.totalDue.toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                Pending payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>On Leave</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                  <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.onLeave}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                Currently absent
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <SearchAndFilter
          variant="card"
          searchValue={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search by name, ID, or trade..."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          filters={[
            {
              placeholder: 'Status',
              options: [
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'onLeave', label: 'On Leave' },
                { value: 'terminated', label: 'Terminated' },
              ],
              value: statusFilter,
              onChange: (value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              },
            },
            {
              placeholder: 'Type',
              options: [
                { value: 'all', label: 'All Types' },
                { value: 'daily', label: 'Daily Wage' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'contract', label: 'Contract' },
                { value: 'piece', label: 'Piece Rate' },
              ],
              value: typeFilter,
              onChange: (value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              },
            },
          ]}
        />

        {/* Showing results and rows per page */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to{' '}
            {Math.min(startIndex + itemsPerPage, filteredLabour.length)} of{' '}
            {filteredLabour.length}{' '}
            {filteredLabour.length === 1 ? 'record' : 'records'}
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Rows per page:
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Labour Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      className={
                        isSomeSelected
                          ? 'data-[state=checked]:bg-primary/50'
                          : ''
                      }
                    />
                  </TableHead>
                  <TableHead>Labour ID</TableHead>
                  <TableHead>Name & Contact</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLabour.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="py-8 text-center text-zinc-500"
                    >
                      No labour records found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLabour.map((labour) => (
                    <TableRow
                      key={labour.id}
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      onClick={() =>
                        (globalThis.location.href = `/dashboard/third-party/labour/${labour.id}`)
                      }
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(labour.id)}
                          onCheckedChange={(checked) =>
                            handleSelectOne(labour.id, checked as boolean)
                          }
                          aria-label={`Select ${labour.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {labour.labourId}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-orange-500 to-orange-600">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {labour.name}
                            </p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-500">
                              {labour.phone}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{labour.trade}</div>
                          <div className="text-xs text-zinc-500">
                            {
                              skillLevelLabels[
                                labour.skillLevel as keyof typeof skillLevelLabels
                              ]
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {typeLabels[labour.type as keyof typeof typeLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {labour.dailyRate && `₹${labour.dailyRate}/day`}
                        {labour.monthlyRate &&
                          `₹${labour.monthlyRate.toLocaleString()}/mo`}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{labour.currentProject}</div>
                        {labour.contractorName && (
                          <div className="text-xs text-zinc-500">
                            {labour.contractorName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`bg-${statusColors[labour.status as keyof typeof statusColors]}-100 text-${statusColors[labour.status as keyof typeof statusColors]}-700 dark:bg-${statusColors[labour.status as keyof typeof statusColors]}-900 dark:text-${statusColors[labour.status as keyof typeof statusColors]}-300`}
                        >
                          {
                            statusLabels[
                              labour.status as keyof typeof statusLabels
                            ]
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {labour.totalDue ? (
                          <span className="font-semibold text-orange-600 dark:text-orange-400">
                            ₹{labour.totalDue.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                asChild
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link
                                  href={`/dashboard/third-party/labour/${labour.id}/edit`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Labour</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {filteredLabour.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
