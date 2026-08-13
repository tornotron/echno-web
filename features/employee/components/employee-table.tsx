'use client';

import { useRouter } from 'next/navigation';
import { Users, Mail } from 'lucide-react';
import {
  Department,
  Employee,
  EmployeeStatus,
  getDepartmentLabel,
} from '@tornotron/echno-core/employee/types';
import { Badge } from '@/components/shadcn/badge';
import { TableCell } from '@/components/shadcn/table';
import { PhoneDisplay } from '@/components/shadcn/phone-input';
import { DataTable, type DataTableColumn } from '@/components/common';
import { EmployeeProjectsCell } from './employee-projects-cell';
import { EmployeeStatusBadge } from './employee-status-badge';
import { EmployeeAvatar } from '@/components/shared/employee-avatar';
import { routes } from '@/nav';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: EmployeeStatus.active, label: 'Active' },
  { value: EmployeeStatus.inactive, label: 'Inactive' },
  { value: EmployeeStatus.onLeave, label: 'On Leave' },
  { value: EmployeeStatus.probation, label: 'Probation' },
  { value: EmployeeStatus.terminated, label: 'Terminated' },
];

const departmentOptions = [
  { value: 'all', label: 'All Departments' },
  ...Object.values(Department).map((dept) => ({
    value: dept,
    label: getDepartmentLabel(dept),
  })),
];

const columns: DataTableColumn<Employee>[] = [
  {
    id: 'employee',
    header: 'Employee',
    cell: (employee) => (
      <TableCell>
        <div className="flex items-center space-x-3">
          <EmployeeAvatar employee={employee} />
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              {employee.name}
            </p>
            {employee.employeeId && (
              <p className="text-xs text-zinc-500">ID: {employee.employeeId}</p>
            )}
          </div>
        </div>
      </TableCell>
    ),
  },
  {
    id: 'designation',
    header: 'Designation',
    cell: (employee) => (
      <TableCell>
        <span className="text-zinc-700 dark:text-zinc-300">
          {employee.designation}
        </span>
      </TableCell>
    ),
  },
  {
    id: 'department',
    header: 'Department',
    cell: (employee) => (
      <TableCell>
        {employee.department ? (
          <Badge variant="outline">
            {getDepartmentLabel(employee.department)}
          </Badge>
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </TableCell>
    ),
  },
  {
    id: 'contact',
    header: 'Contact',
    cell: (employee) => (
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
    ),
  },
  {
    id: 'projects',
    header: 'Projects',
    cell: (employee) => (
      <TableCell>
        <EmployeeProjectsCell
          employeeId={employee.id}
          projects={employee.currentProjects}
        />
      </TableCell>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (employee) => (
      <TableCell>
        <EmployeeStatusBadge status={employee.status} />
      </TableCell>
    ),
  },
];

interface EmployeeTableProps {
  employees: Employee[];
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  const router = useRouter();

  return (
    <DataTable<Employee>
      data={employees}
      columns={columns}
      getRowId={(employee) => employee.id}
      enableSelection
      searchPlaceholder="Search by name, email, phone or ID..."
      searchPredicate={(employee, query) => {
        const q = query.toLowerCase();
        return (
          employee.name.toLowerCase().includes(q) ||
          employee.email.toLowerCase().includes(q) ||
          employee.phone.toLowerCase().includes(q) ||
          (employee.employeeId?.toLowerCase().includes(q) ?? false)
        );
      }}
      filters={[
        {
          id: 'status',
          placeholder: 'All Status',
          options: statusOptions,
          predicate: (employee, value) => employee.status === value,
        },
        {
          id: 'department',
          placeholder: 'All Departments',
          options: departmentOptions,
          predicate: (employee, value) => employee.department === value,
        },
      ]}
      onRowClick={(employee) =>
        router.push(
          routes.workforce.employees.employeeManagement.detail(employee.id).href
        )
      }
      entityNoun={{ one: 'employee', many: 'employees' }}
      emptyIcon={<Users className="size-6" />}
      emptyTitle="No employees found"
      emptyDescription="There are no employees to show."
    />
  );
}
