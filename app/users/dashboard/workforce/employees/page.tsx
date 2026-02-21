'use client';

import { useState, useMemo } from 'react';
import { Pagination, SearchAndFilter } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { EmployeeStatus, getDepartmentLabel } from '@/types/employee';
import { Department } from '@/types/employee';
import { useEmployees } from '@/hooks/employee';
import { useProjects } from '@/hooks/project';
import { useUser } from '@/hooks/user/use-user';
import { EmployeeProjectsCellContainer } from '@/components/workforce/employee-projects-cell';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case 'inactive': {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
    case 'onLeave': {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': {
      return 'Active';
    }
    case 'inactive': {
      return 'Inactive';
    }
    case 'onLeave': {
      return 'On Leave';
    }
    default: {
      return status;
    }
  }
};

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [designationFilter, setDesignationFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: user } = useUser();
  const { data: employees, isLoading, error } = useEmployees();
  const { data: projects } = useProjects();

  const employeesList = useMemo(() => employees || [], [employees]);

  // Get unique designations from employees (filter out empty values)
  const uniqueDesignations = [
    ...new Set(employeesList.map((emp) => emp.designation).filter(Boolean)),
  ].toSorted();

  // Filter employees based on search and filters
  const filteredEmployees = useMemo(() => {
    return employeesList.filter((employee) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        employee.name.toLowerCase().includes(searchLower) ||
        employee.email.toLowerCase().includes(searchLower) ||
        employee.phone.toLowerCase().includes(searchLower) ||
        employee.employeeId?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus =
        statusFilter === 'all' || employee.status === statusFilter;

      // Project filter
      const matchesProject =
        projectFilter === 'all' ||
        employee.currentProjects?.some(
          (project) => project.id?.toString() === projectFilter
        );

      // Department filter
      const matchesDepartment =
        departmentFilter === 'all' || employee.department === departmentFilter;

      // Designation filter
      const matchesDesignation =
        designationFilter === 'all' ||
        employee.designation === designationFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesProject &&
        matchesDepartment &&
        matchesDesignation
      );
    });
  }, [
    searchQuery,
    statusFilter,
    projectFilter,
    departmentFilter,
    designationFilter,
    employeesList,
  ]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(
        paginatedEmployees
          .map((e) => e.id)
          .filter((id): id is number => id !== undefined)
      );
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
    paginatedEmployees.length > 0 &&
    selectedIds.length === paginatedEmployees.length;

  // Statistics
  const totalEmployees = employeesList.length;
  const activeEmployees = employeesList.filter(
    (emp) => emp.status === EmployeeStatus.active
  ).length;
  const inactiveEmployees = employeesList.filter(
    (emp) => emp.status === EmployeeStatus.inactive
  ).length;
  const onLeaveEmployees = employeesList.filter(
    (emp) => emp.status === EmployeeStatus.onLeave
  ).length;

  const hasActiveFilters = Boolean(
    searchQuery ||
      statusFilter !== 'all' ||
      projectFilter !== 'all' ||
      departmentFilter !== 'all' ||
      designationFilter !== 'all'
  );

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setProjectFilter('all');
    setDepartmentFilter('all');
    setDesignationFilter('all');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-xl font-semibold">Error Loading Employees</h2>
        <p className="text-zinc-500">
          Failed to load employees. Please try again later.
        </p>
      </div>
    );
  }

  if (!user?.defaultOrganizationId) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-yellow-500" />
        <h2 className="mb-2 text-xl font-semibold">No Organization Selected</h2>
        <p className="text-zinc-500">
          Please select an organization to view employees.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Employees
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Manage and view all employees in your organizations
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {totalEmployees}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {activeEmployees}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Inactive</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
                <Users className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {inactiveEmployees}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>On Leave</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                <Users className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {onLeaveEmployees}
              </span>
            </div>
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
        searchPlaceholder="Search by name, email, phone, or ID..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Status',
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: EmployeeStatus.active, label: 'Active' },
              { value: EmployeeStatus.inactive, label: 'Inactive' },
              { value: EmployeeStatus.onLeave, label: 'On Leave' },
            ],
            value: statusFilter,
            onChange: (value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            },
          },
          {
            placeholder: 'Project',
            options: [
              { value: 'all', label: 'All Projects' },
              ...(projects || []).map((proj) => ({
                value: proj.id!.toString(),
                label: proj.projectName,
              })),
            ],
            value: projectFilter,
            onChange: (value) => {
              setProjectFilter(value);
              setCurrentPage(1);
            },
          },
          {
            placeholder: 'Department',
            options: [
              { value: 'all', label: 'All Departments' },
              { value: Department.engineering, label: 'Engineering' },
              { value: Department.construction, label: 'Construction' },
              { value: Department.safety, label: 'Safety' },
              { value: Department.quality, label: 'Quality' },
              { value: Department.administration, label: 'Administration' },
              { value: Department.humanResources, label: 'Human Resources' },
              { value: Department.finance, label: 'Finance' },
              { value: Department.procurement, label: 'Procurement' },
              { value: Department.planning, label: 'Planning' },
              { value: Department.maintenance, label: 'Maintenance' },
              { value: Department.security, label: 'Security' },
              { value: Department.operations, label: 'Operations' },
              { value: Department.it, label: 'IT' },
              { value: Department.legal, label: 'Legal' },
              { value: Department.marketing, label: 'Marketing' },
            ],
            value: departmentFilter,
            onChange: (value) => {
              setDepartmentFilter(value);
              setCurrentPage(1);
            },
          },
          {
            placeholder: 'Designation',
            options: [
              { value: 'all', label: 'All Designations' },
              ...uniqueDesignations.map((designation) => ({
                value: designation,
                label: designation,
              })),
            ],
            value: designationFilter,
            onChange: (value) => {
              setDesignationFilter(value);
              setCurrentPage(1);
            },
          },
        ]}
      />

      {/* Results Summary */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {startIndex + 1} to{' '}
          {Math.min(endIndex, filteredEmployees.length)} of{' '}
          {filteredEmployees.length} employees
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
            <SelectTrigger className="w-[70px]">
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

      {/* Mobile Card View */}
      <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:hidden">
        {paginatedEmployees.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-zinc-500">
              No employee records found
            </CardContent>
          </Card>
        ) : (
          paginatedEmployees.map((employee) => (
            <Card
              key={employee.id}
              className="cursor-pointer"
              onClick={() =>
                (globalThis.location.href = `/users/dashboard/workforce/employees/${employee.id}`)
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {employee.profilePicture?.file ? (
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={employee.profilePicture.file}
                          alt={employee.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {employee.name}
                      </p>
                      {employee.employeeId && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-500">
                          ID: {employee.employeeId}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(employee.status)}>
                    {getStatusLabel(employee.status)}
                  </Badge>
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Designation
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {employee.designation}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Department
                    </span>
                    {employee.department ? (
                      <Badge variant="outline">
                        {getDepartmentLabel(employee.department)}
                      </Badge>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        {filteredEmployees.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Employees Table */}
      {filteredEmployees.length > 0 ? (
        <Card className="hidden lg:block">
          <CardContent className="p-0">
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
                  <TableHead>Employee</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployees.map((employee) => {
                  return (
                    <TableRow
                      key={employee.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() =>
                        (globalThis.location.href = `/users/dashboard/workforce/employees/${employee.id}`)
                      }
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={
                            employee.id !== undefined &&
                            selectedIds.includes(employee.id)
                          }
                          onCheckedChange={(checked) =>
                            employee.id !== undefined &&
                            handleSelectOne(employee.id, checked as boolean)
                          }
                          aria-label={`Select ${employee.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {employee.profilePicture?.file ? (
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                              <Image
                                src={employee.profilePicture.file}
                                alt={employee.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
                              <User className="h-5 w-5 text-white" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {employee.name}
                            </p>
                            {employee.employeeId && (
                              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                ID: {employee.employeeId}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {employee.designation}
                        </span>
                      </TableCell>
                      <TableCell>
                        {employee.department ? (
                          <Badge variant="outline">
                            {getDepartmentLabel(employee.department)}
                          </Badge>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="h-3 w-3 text-zinc-400" />
                            <span className="max-w-[200px] truncate text-zinc-600 dark:text-zinc-400">
                              {employee.email}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-3 w-3 text-zinc-400" />
                            <span className="text-zinc-600 dark:text-zinc-400">
                              {employee.phone}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {employee.id !== undefined && (
                          <EmployeeProjectsCellContainer
                            employeeId={employee.id}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(employee.status)}>
                          {getStatusLabel(employee.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Card>
      ) : (
        <Card className="hidden lg:block">
          <CardContent className="py-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              No employees found
            </h3>
            <p className="mb-4 text-zinc-600 dark:text-zinc-400">
              {hasActiveFilters
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first employee'}
            </p>
            {!hasActiveFilters && (
              <Link href="/users/dashboard/workforce/invitations/new">
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Invitation
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
