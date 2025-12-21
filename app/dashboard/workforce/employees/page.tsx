'use client';

import { useState, useMemo } from 'react';
import {
  mockEmployees,
  mockOrganizations,
} from '@/components/shared/mock-data';
import { AppLayout, Pagination } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Users,
  UserPlus,
  Filter,
  Mail,
  Phone,
  User,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { EmployeeStatus, getDepartmentLabel } from '@/types/employee';
import { Department } from '@/types/employee';

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
  const [organizationFilter, setOrganizationFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [designationFilter, setDesignationFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Get unique designations from employees
  const uniqueDesignations = [
    ...new Set(mockEmployees.map((emp) => emp.designation)),
  ].toSorted();

  // Filter employees based on search and filters
  const filteredEmployees = useMemo(() => {
    return mockEmployees.filter((employee) => {
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

      // Organization filter
      const matchesOrganization =
        organizationFilter === 'all' ||
        employee.organizations?.some(
          (org) => org.id === Number.parseInt(organizationFilter)
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
        matchesOrganization &&
        matchesDepartment &&
        matchesDesignation
      );
    });
  }, [
    searchQuery,
    statusFilter,
    organizationFilter,
    departmentFilter,
    designationFilter,
  ]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Statistics
  const totalEmployees = mockEmployees.length;
  const activeEmployees = mockEmployees.filter(
    (emp) => emp.status === EmployeeStatus.active
  ).length;
  const inactiveEmployees = mockEmployees.filter(
    (emp) => emp.status === EmployeeStatus.inactive
  ).length;
  const onLeaveEmployees = mockEmployees.filter(
    (emp) => emp.status === EmployeeStatus.onLeave
  ).length;

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== 'all' ||
    organizationFilter !== 'all' ||
    departmentFilter !== 'all' ||
    designationFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setOrganizationFilter('all');
    setDepartmentFilter('all');
    setDesignationFilter('all');
    setCurrentPage(1);
  };

  return (
    <AppLayout>
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
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
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
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                <CardTitle>Search & Filters</CardTitle>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-zinc-400" />
                  <Input
                    placeholder="Search by name, email, phone, or ID..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={EmployeeStatus.active}>Active</SelectItem>
                  <SelectItem value={EmployeeStatus.inactive}>
                    Inactive
                  </SelectItem>
                  <SelectItem value={EmployeeStatus.onLeave}>
                    On Leave
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Organization Filter */}
              <Select
                value={organizationFilter}
                onValueChange={(value) => {
                  setOrganizationFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {mockOrganizations.map((org) => (
                    <SelectItem key={org.id} value={org.id!.toString()}>
                      {org.organizationName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Department Filter */}
              <Select
                value={departmentFilter}
                onValueChange={(value) => {
                  setDepartmentFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value={Department.engineering}>
                    Engineering
                  </SelectItem>
                  <SelectItem value={Department.construction}>
                    Construction
                  </SelectItem>
                  <SelectItem value={Department.safety}>Safety</SelectItem>
                  <SelectItem value={Department.quality}>Quality</SelectItem>
                  <SelectItem value={Department.administration}>
                    Administration
                  </SelectItem>
                  <SelectItem value={Department.humanResources}>
                    Human Resources
                  </SelectItem>
                  <SelectItem value={Department.finance}>Finance</SelectItem>
                  <SelectItem value={Department.procurement}>
                    Procurement
                  </SelectItem>
                  <SelectItem value={Department.planning}>Planning</SelectItem>
                  <SelectItem value={Department.maintenance}>
                    Maintenance
                  </SelectItem>
                  <SelectItem value={Department.security}>Security</SelectItem>
                  <SelectItem value={Department.operations}>
                    Operations
                  </SelectItem>
                  <SelectItem value={Department.it}>IT</SelectItem>
                  <SelectItem value={Department.legal}>Legal</SelectItem>
                  <SelectItem value={Department.marketing}>
                    Marketing
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Designation Filter - Second Row */}
            <div className="mt-4">
              <Select
                value={designationFilter}
                onValueChange={(value) => {
                  setDesignationFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Designations</SelectItem>
                  {uniqueDesignations.map((designation) => (
                    <SelectItem key={designation} value={designation}>
                      {designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
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

        {/* Employees Table */}
        {filteredEmployees.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Organizations</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEmployees.map((employee) => {
                    return (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
                              <User className="h-5 w-5 text-white" />
                            </div>
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
                          <Badge variant="outline">
                            {getDepartmentLabel(employee.department)}
                          </Badge>
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
                          {employee.organizations &&
                          employee.organizations.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {employee.organizations.slice(0, 2).map((org) => (
                                <Badge
                                  key={org.id}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {org.organizationName}
                                </Badge>
                              ))}
                              {employee.organizations.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{employee.organizations.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(employee.status)}>
                            {getStatusLabel(employee.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={`/dashboard/workforce/employees/${employee.id}`}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Employee Details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
          <Card>
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
                <Link href="/dashboard/workforce/employees/new">
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Employee
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
