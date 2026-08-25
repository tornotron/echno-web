'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import {
  Pagination,
  SearchAndFilter,
  ActiveFilterChip,
} from '@/components/common';
import {
  useEmployeeFilterFromParams,
  rowMatchesEmployeeFilter,
  ROLE_LABELS,
} from '@/hooks/use-employee-filter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  ClipboardCheck,
  Plus,
  Calendar,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  InspectionStatus,
  InspectionType,
  InspectionResult,
  inspectionStatusLabels,
  inspectionTypeLabels,
  inspectionResultLabels,
  complianceRiskLevelLabels,
  complianceRiskLevelBadgeColors,
  compliancePhaseLabels,
} from '@/types/inspection';
import { useInspections } from '@/hooks/inspection';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { routes } from '@/nav';

const getStatusBadgeColor = (status: InspectionStatus): string => {
  const colors: Record<InspectionStatus, string> = {
    [InspectionStatus.SCHEDULED]:
      'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    [InspectionStatus.IN_PROGRESS]:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    [InspectionStatus.COMPLETED]:
      'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    [InspectionStatus.FAILED]:
      'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    [InspectionStatus.PASSED]:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    [InspectionStatus.PASSED_WITH_REMARKS]:
      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    [InspectionStatus.CANCELLED]:
      'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
    [InspectionStatus.SUGGESTED]:
      'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  };
  return colors[status];
};

const getResultBadgeColor = (result: InspectionResult): string => {
  const colors: Record<InspectionResult, string> = {
    [InspectionResult.PASSED]:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    [InspectionResult.FAILED]:
      'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    [InspectionResult.PASSED_WITH_REMARKS]:
      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    [InspectionResult.PENDING]:
      'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
  };
  return colors[result];
};

export default function InspectionsPage() {
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployeeLookup();
  const { data: inspections = [] } = useInspections();
  const { employeeId, role, name, clear } = useEmployeeFilterFromParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | 'all'>(
    'all'
  );
  const [typeFilter, setTypeFilter] = useState<InspectionType | 'all'>('all');
  const [resultFilter, setResultFilter] = useState<InspectionResult | 'all'>(
    'all'
  );
  const [projectFilter, setProjectFilter] = useState<number | 'all'>('all');

  const inspectorName = (
    inspectorId: number | null | undefined,
  ): string | undefined =>
    inspectorId == null
      ? undefined
      : employees.find((emp) => emp.id === inspectorId)?.name;

  // Filter inspections
  const filteredInspections = useMemo(() => {
    return inspections.filter((inspection) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        inspection.inspectionNumber.toLowerCase().includes(query) ||
        inspection.title.toLowerCase().includes(query) ||
        (inspection.location ?? '').toLowerCase().includes(query) ||
        (inspectorName(inspection.inspectorId) ?? '')
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === 'all' || inspection.status === statusFilter;
      const matchesType =
        typeFilter === 'all' || inspection.type === typeFilter;
      const matchesResult =
        resultFilter === 'all' || inspection.result === resultFilter;
      const matchesProject =
        projectFilter === 'all' || inspection.projectId === projectFilter;
      const matchesEmployee =
        employeeId == null ||
        role == null ||
        rowMatchesEmployeeFilter(inspection, employeeId, role, {
          inspector: (i) => i.inspectorId,
        });

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesResult &&
        matchesProject &&
        matchesEmployee
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    inspections,
    employees,
    searchQuery,
    statusFilter,
    typeFilter,
    resultFilter,
    projectFilter,
    employeeId,
    role,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInspections = filteredInspections.slice(startIndex, endIndex);

  // Calculate stats
  const totalInspections = inspections.length;
  const scheduledCount = inspections.filter(
    (i) => i.status === InspectionStatus.SCHEDULED
  ).length;
  const inProgressCount = inspections.filter(
    (i) => i.status === InspectionStatus.IN_PROGRESS
  ).length;

  const defectsCount = inspections.reduce((sum, i) => sum + i.defectsFound, 0);

  const hasActiveFilters = Boolean(
    searchQuery ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    resultFilter !== 'all' ||
    projectFilter !== 'all'
  );

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setResultFilter('all');
    setProjectFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
            Work Inspection Reports
          </h1>
          <p className="mt-1 text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
            Track and manage construction site inspections
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href={routes.portfolio.inspections.new}>
            <Plus className="mr-2 h-4 w-4" />
            New Inspection
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Total Inspections
            </CardTitle>
            <ClipboardCheck className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInspections}</div>
            <p className="text-muted-foreground text-xs">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Scheduled
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {scheduledCount}
            </div>
            <p className="text-muted-foreground text-xs">Upcoming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              In Progress
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {inProgressCount}
            </div>
            <p className="text-muted-foreground text-xs">Active now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Defects Found
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {defectsCount}
            </div>
            <p className="text-muted-foreground text-xs">Across all reports</p>
          </CardContent>
        </Card>
      </div>

      {employeeId != null && name && (
        <ActiveFilterChip
          label={ROLE_LABELS[role ?? ''] ?? 'Filtered by'}
          name={name}
          onDismiss={clear}
        />
      )}

      {/* Filters */}
      <SearchAndFilter
        variant="card"
        searchValue={searchQuery}
        onSearchChange={(value: string) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by number, title, location, inspector..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Status',
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: InspectionStatus.SCHEDULED, label: 'Scheduled' },
              { value: InspectionStatus.IN_PROGRESS, label: 'In Progress' },
              { value: InspectionStatus.COMPLETED, label: 'Completed' },
              { value: InspectionStatus.PASSED, label: 'Passed' },
              { value: InspectionStatus.FAILED, label: 'Failed' },
              {
                value: InspectionStatus.PASSED_WITH_REMARKS,
                label: 'Passed with Remarks',
              },
              { value: InspectionStatus.CANCELLED, label: 'Cancelled' },
            ],
            value: statusFilter,
            onChange: (value) => {
              setStatusFilter(value as InspectionStatus | 'all');
              setCurrentPage(1);
            },
          },
          {
            placeholder: 'Type',
            options: [
              { value: 'all', label: 'All Types' },
              { value: InspectionType.SAFETY, label: 'Safety' },
              { value: InspectionType.QUALITY, label: 'Quality' },
              { value: InspectionType.PROGRESS, label: 'Progress' },
              { value: InspectionType.FINAL, label: 'Final' },
              { value: InspectionType.STRUCTURAL, label: 'Structural' },
              { value: InspectionType.ELECTRICAL, label: 'Electrical' },
              { value: InspectionType.PLUMBING, label: 'Plumbing' },
              { value: InspectionType.FINISHING, label: 'Finishing' },
              { value: InspectionType.COMPLIANCE, label: 'Compliance' },
            ],
            value: typeFilter,
            onChange: (value) => {
              setTypeFilter(value as InspectionType | 'all');
              setCurrentPage(1);
            },
          },
          {
            placeholder: 'Result',
            options: [
              { value: 'all', label: 'All Results' },
              { value: InspectionResult.PASSED, label: 'Passed' },
              { value: InspectionResult.FAILED, label: 'Failed' },
              {
                value: InspectionResult.PASSED_WITH_REMARKS,
                label: 'Passed with Remarks',
              },
              { value: InspectionResult.PENDING, label: 'Pending' },
            ],
            value: resultFilter,
            onChange: (value) => {
              setResultFilter(value as InspectionResult | 'all');
              setCurrentPage(1);
            },
          },
          {
            placeholder: 'Project',
            options: [
              { value: 'all', label: 'All Projects' },
              ...projects.map((project) => ({
                value: project.id.toString(),
                label: project.projectName,
              })),
            ],
            value: projectFilter.toString(),
            onChange: (value) => {
              setProjectFilter(
                value === 'all' ? 'all' : Number.parseInt(value)
              );
              setCurrentPage(1);
            },
          },
        ]}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {startIndex + 1} to{' '}
          {Math.min(endIndex, filteredInspections.length)} of{' '}
          {filteredInspections.length} inspections
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Rows per page:
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number.parseInt(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Inspections List */}
      {filteredInspections.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {paginatedInspections.map((inspection) => (
                <Link
                  key={inspection.id}
                  href={routes.portfolio.inspections.detail(inspection.id).href}
                  className="block rounded-lg border p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    {/* Left Section */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                              {inspection.inspectionNumber}
                            </span>
                            <Badge
                              className={getStatusBadgeColor(inspection.status)}
                            >
                              {inspectionStatusLabels[inspection.status]}
                            </Badge>
                            <Badge variant="outline">
                              {inspectionTypeLabels[inspection.type]}
                            </Badge>
                            {inspection.result &&
                              inspection.result !==
                                InspectionResult.PENDING && (
                                <Badge
                                  className={getResultBadgeColor(
                                    inspection.result
                                  )}
                                >
                                  {inspectionResultLabels[inspection.result]}
                                </Badge>
                              )}
                            {inspection.riskLevel && (
                              <Badge
                                className={
                                  complianceRiskLevelBadgeColors[
                                    inspection.riskLevel
                                  ]
                                }
                              >
                                {
                                  complianceRiskLevelLabels[
                                    inspection.riskLevel
                                  ]
                                }{' '}
                                risk
                              </Badge>
                            )}
                            {inspection.compliancePhase && (
                              <Badge variant="outline">
                                {
                                  compliancePhaseLabels[
                                    inspection.compliancePhase
                                  ]
                                }
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {inspection.title}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-500">
                            Location:
                          </span>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {inspection.location || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-500">
                            Inspector:
                          </span>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {inspectorName(inspection.inspectorId) ||
                              'Not assigned'}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-500">
                            Date:
                          </span>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {inspection.scheduledDate
                              ? format(
                                  new Date(inspection.scheduledDate),
                                  'MMM dd, yyyy'
                                )
                              : '—'}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-500">
                            Defects:
                          </span>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {inspection.defectsFound}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              {hasActiveFilters ? 'No inspections found' : 'No inspections yet'}
            </h3>
            <p className="mb-4 text-zinc-600 dark:text-zinc-400">
              {hasActiveFilters
                ? "Try adjusting your filters to find what you're looking for."
                : 'Schedule your first inspection to get started.'}
            </p>
            {hasActiveFilters ? (
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            ) : (
              <Button asChild>
                <Link href={routes.portfolio.inspections.new}>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Inspection
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
