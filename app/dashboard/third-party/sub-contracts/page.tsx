'use client';

import { useState } from 'react';
import { AppLayout, Pagination, SearchAndFilter } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
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
  ClipboardList,
  Plus,
  Download,
  FileText,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import Link from 'next/link';
import { mockContracts } from '@/components/shared/mock-data';

const typeLabels = {
  lumpsum: 'Lump Sum',
  itemRate: 'Item Rate',
  timeAndMaterial: 'Time & Material',
  costPlus: 'Cost Plus',
  unitPrice: 'Unit Price',
};

const statusColors = {
  draft: 'zinc',
  active: 'green',
  onHold: 'orange',
  completed: 'blue',
  terminated: 'red',
  expired: 'red',
};

const statusLabels = {
  draft: 'Draft',
  active: 'Active',
  onHold: 'On Hold',
  completed: 'Completed',
  terminated: 'Terminated',
  expired: 'Expired',
};

const paymentStatusColors = {
  notStarted: 'zinc',
  inProgress: 'blue',
  fullyPaid: 'green',
  overdue: 'red',
};

const paymentStatusLabels = {
  notStarted: 'Not Started',
  inProgress: 'In Progress',
  fullyPaid: 'Fully Paid',
  overdue: 'Overdue',
};

const getProgressColor = (percentage: number) => {
  if (percentage === 100) return 'bg-green-500';
  if (percentage >= 75) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-yellow-500';
  return 'bg-orange-500';
};

export default function SubContractsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const hasActiveFilters =
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    projectFilter !== 'all' ||
    searchQuery !== '';

  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setProjectFilter('all');
    setSearchQuery('');
  };

  // Get unique projects for filter
  const uniqueProjects = [
    ...new Set(mockContracts.map((c) => c.projectName).filter(Boolean)),
  ].toSorted();

  // Filter data
  const filteredContracts = mockContracts.filter((contract) => {
    const matchesSearch =
      contract.contractName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.contractId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.contractorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || contract.status === statusFilter;
    const matchesType = typeFilter === 'all' || contract.type === typeFilter;
    const matchesProject =
      projectFilter === 'all' || contract.projectName === projectFilter;
    return matchesSearch && matchesStatus && matchesType && matchesProject;
  });

  // Pagination
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContracts = filteredContracts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedContracts.map((c) => c.id));
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
    paginatedContracts.length > 0 &&
    selectedIds.length === paginatedContracts.length;

  // Statistics
  const stats = {
    total: mockContracts.length,
    active: mockContracts.filter((c) => c.status === 'active').length,
    totalValue: mockContracts.reduce((sum, c) => sum + c.contractValue, 0),
    totalOutstanding: mockContracts.reduce((sum, c) => sum + c.totalDue, 0),
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center space-x-3 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              <ClipboardList className="h-8 w-8" />
              <span>Sub-Contract Management</span>
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Manage sub-contractor agreements and work orders
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/third-party/sub-contracts/new">
                <Plus className="mr-2 h-4 w-4" />
                New Contract
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Contracts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.total}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                All contracts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Contracts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.active}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                In progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  ₹{(stats.totalValue / 10_000_000).toFixed(1)}Cr
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                Contract value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Outstanding</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                  <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  ₹{(stats.totalOutstanding / 10_000_000).toFixed(1)}Cr
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                Pending payments
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
          searchPlaceholder="Search by contract ID, company, or contact..."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          filters={[
            {
              placeholder: 'Status',
              options: [
                { value: 'all', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'active', label: 'Active' },
                { value: 'onHold', label: 'On Hold' },
                { value: 'completed', label: 'Completed' },
                { value: 'terminated', label: 'Terminated' },
                { value: 'expired', label: 'Expired' },
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
                { value: 'lumpsum', label: 'Lump Sum' },
                { value: 'itemRate', label: 'Item Rate' },
                { value: 'timeAndMaterial', label: 'Time & Material' },
                { value: 'costPlus', label: 'Cost Plus' },
                { value: 'unitPrice', label: 'Unit Price' },
              ],
              value: typeFilter,
              onChange: (value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              },
            },
            {
              placeholder: 'Project',
              options: [
                { value: 'all', label: 'All Projects' },
                ...uniqueProjects.map((project) => ({
                  value: project,
                  label: project,
                })),
              ],
              value: projectFilter,
              onChange: (value) => {
                setProjectFilter(value);
                setCurrentPage(1);
              },
            },
          ]}
        />

        {/* Showing results and rows per page */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to{' '}
            {Math.min(startIndex + itemsPerPage, filteredContracts.length)} of{' '}
            {filteredContracts.length}{' '}
            {filteredContracts.length === 1 ? 'record' : 'records'}
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

        {/* Filters and Table */}
        <Card>
          <CardContent className="p-0">
            {/* Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Contract Details</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedContracts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-zinc-500"
                    >
                      No contract records found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedContracts.map((contract) => {
                    const daysRemaining = differenceInDays(
                      contract.endDate,
                      new Date()
                    );
                    const isNearDeadline =
                      daysRemaining > 0 && daysRemaining <= 30;

                    return (
                      <TableRow
                        key={contract.id}
                        className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        onClick={() =>
                          (globalThis.location.href = `/dashboard/third-party/sub-contracts/${contract.id}`)
                        }
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(contract.id)}
                            onCheckedChange={(checked) =>
                              handleSelectOne(contract.id, checked as boolean)
                            }
                            aria-label={`Select ${contract.contractId}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {contract.contractName}
                            </div>
                            <div className="text-sm text-zinc-500">
                              {contract.projectName}
                            </div>
                            <div className="mt-1 flex items-center space-x-1 text-xs text-zinc-400">
                              <Clock className="h-3 w-3" />
                              <span>
                                {format(contract.endDate, 'MMM d, yyyy')}
                              </span>
                              {isNearDeadline && (
                                <AlertCircle className="ml-1 h-3 w-3 text-orange-500" />
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {contract.contractorName}
                              </p>
                              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                                {contract.contactPerson}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {
                              typeLabels[
                                contract.type as keyof typeof typeLabels
                              ]
                            }
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="w-full">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {contract.completionPercentage}%
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                              <div
                                className={`h-2 rounded-full ${getProgressColor(contract.completionPercentage)}`}
                                style={{
                                  width: `${contract.completionPercentage}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-blue-600 dark:text-blue-400">
                            ₹{(contract.contractValue / 100_000).toFixed(1)}L
                          </div>
                          <div className="text-xs text-zinc-500">
                            Paid: ₹{(contract.totalPaid / 100_000).toFixed(1)}L
                          </div>
                        </TableCell>
                        <TableCell>
                          {contract.totalDue > 0 ? (
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              ₹{(contract.totalDue / 100_000).toFixed(1)}L
                            </span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400">
                              Paid
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge
                              className={`bg-${statusColors[contract.status as keyof typeof statusColors]}-100 text-${statusColors[contract.status as keyof typeof statusColors]}-700 dark:bg-${statusColors[contract.status as keyof typeof statusColors]}-900 dark:text-${statusColors[contract.status as keyof typeof statusColors]}-300`}
                            >
                              {
                                statusLabels[
                                  contract.status as keyof typeof statusLabels
                                ]
                              }
                            </Badge>
                            <div>
                              <Badge
                                variant="outline"
                                className={`text-xs bg-${paymentStatusColors[contract.paymentStatus as keyof typeof paymentStatusColors]}-50 border-${paymentStatusColors[contract.paymentStatus as keyof typeof paymentStatusColors]}-200`}
                              >
                                {
                                  paymentStatusLabels[
                                    contract.paymentStatus as keyof typeof paymentStatusLabels
                                  ]
                                }
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {filteredContracts.length > 0 && (
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
