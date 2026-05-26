'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users } from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import {
  Employee,
  EmployeeStatus,
  Department,
  getDepartmentLabel,
} from '@/types/employee';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { Pagination } from '@/components/common';
import { Mail } from 'lucide-react';
import { PhoneDisplay } from '@/components/shadcn/phone-input';
import { EmployeeProjectsCell } from './employee-projects-cell';
import { EmployeeStatusBadge } from './employee-status-badge';
import { EmployeeAvatar } from '@/components/shared/employee-avatar';
import { routes } from '@/nav';

interface EmployeeTableProps {
  employees: Employee[];
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return employees.filter((emp) => {
      const matchesSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.phone.toLowerCase().includes(q) ||
        emp.employeeId?.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'all' || emp.status === statusFilter;
      const matchesDept =
        departmentFilter === 'all' || emp.department === departmentFilter;
      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [employees, searchQuery, statusFilter, departmentFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const isAllSelected =
    paginated.length > 0 && selectedIds.length === paginated.length;

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? paginated.map((e) => e.id) : []);
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleDeptChange = (value: string) => {
    setDepartmentFilter(value);
    setCurrentPage(1);
  };

  const handleItemsPerPage = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  return (
    <Card className="gap-0 py-0">
      {/* Search & filter bar */}
      <CardHeader className="flex flex-row items-center gap-3 border-b px-4 py-6">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, email, phone or ID..."
            className="h-8 pl-8 text-sm"
          />
        </div>

        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={EmployeeStatus.active}>Active</SelectItem>
            <SelectItem value={EmployeeStatus.inactive}>Inactive</SelectItem>
            <SelectItem value={EmployeeStatus.onLeave}>On Leave</SelectItem>
            <SelectItem value={EmployeeStatus.probation}>Probation</SelectItem>
            <SelectItem value={EmployeeStatus.terminated}>
              Terminated
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={departmentFilter} onValueChange={handleDeptChange}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {Object.values(Department).map((dept) => (
              <SelectItem key={dept} value={dept}>
                {getDepartmentLabel(dept)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2 border-l pl-3">
          <span className="text-xs whitespace-nowrap text-zinc-500">
            Rows per page
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPage}
          >
            <SelectTrigger className="h-8 w-[60px] text-xs">
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
      </CardHeader>

      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 pl-5">
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
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Empty variant="inline">
                    <EmptyMedia variant="icon">
                      <Users className="size-6" />
                    </EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>No employees found</EmptyTitle>
                      <EmptyDescription>
                        Try adjusting your search or filters
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {paginated.map((employee) => (
              <TableRow
                key={employee.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() =>
                  router.push(
                    routes.workforce.employees.employeeManagement.detail(
                      employee.id
                    ).href
                  )
                }
              >
                <TableCell
                  className="pl-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedIds.includes(employee.id)}
                    onCheckedChange={(checked) =>
                      handleSelectOne(employee.id, checked as boolean)
                    }
                    aria-label={`Select ${employee.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <EmployeeAvatar employee={employee} />
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {employee.name}
                      </p>
                      {employee.employeeId && (
                        <p className="text-xs text-zinc-500">
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
                    <PhoneDisplay
                      value={employee.phone}
                      asLink
                      className="text-zinc-600 dark:text-zinc-400"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <EmployeeProjectsCell
                    employeeId={employee.id}
                    projects={employee.currentProjects}
                  />
                </TableCell>
                <TableCell>
                  <EmployeeStatusBadge status={employee.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Footer — showing count + pagination */}
      <div className="flex items-center justify-between border-t px-4 py-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Showing {filtered.length === 0 ? 0 : startIndex + 1}–
          {Math.min(startIndex + itemsPerPage, filtered.length)} of{' '}
          {filtered.length}
        </span>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </Card>
  );
}
