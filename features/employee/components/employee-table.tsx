'use client';

import { Employee, getDepartmentLabel } from '@/types/employee';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination } from '@/components/common';
import { Users, UserPlus, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmployeeProjectsCell } from './employee-projects-cell';
import { EmployeeStatusBadge } from './employee-status-badge';
import { EmployeeAvatar } from './employee-avatar';

interface EmployeeTableProps {
  filteredEmployees: Employee[];
  paginatedEmployees: Employee[];
  selectedIds: number[];
  isAllSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: number, checked: boolean) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
}

export function EmployeeTable({
  filteredEmployees,
  paginatedEmployees,
  selectedIds,
  isAllSelected,
  onSelectAll,
  onSelectOne,
  currentPage,
  totalPages,
  onPageChange,
  hasActiveFilters,
}: EmployeeTableProps) {
  const router = useRouter();

  if (filteredEmployees.length === 0) {
    return (
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
    );
  }

  return (
    <Card className="hidden lg:block">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
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
                    router.push(
                      `/users/dashboard/workforce/employees/${employee.id}`
                    )
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
                        onSelectOne(employee.id, checked as boolean)
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
                    <EmployeeProjectsCell
                      employeeId={employee.id}
                      projects={employee.currentProjects ?? []}
                    />
                  </TableCell>
                  <TableCell>
                    <EmployeeStatusBadge status={employee.status} />
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
        onPageChange={onPageChange}
      />
    </Card>
  );
}
