'use client';

import { useState } from 'react';
import { PageHeader, OrgGuard } from '@/components/common';
import { useEmployeesPage } from '@tornotron/echno-core/employee/hooks';
import { useUser } from '@tornotron/echno-core/user/hooks';
import { EmployeeTable } from '@/features/employee/components/employee-table';
import { EmployeeEmptyState } from '@/features/employee/components/employee-empty-state';
import { useDebounce } from '@/hooks/use-debounce';

export default function EmployeesPage() {
  const { data: user, isLoading: isUserLoading, error: userError } = useUser();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedSearch = useDebounce(search);

  const status = statusFilter === 'all' ? undefined : statusFilter;
  const department = departmentFilter === 'all' ? undefined : departmentFilter;
  const searchTerm = debouncedSearch.trim() || undefined;

  const {
    data: employeePage,
    isLoading,
    isFetching,
    error: employeesError,
  } = useEmployeesPage({
    page: page - 1,
    size: pageSize,
    search: searchTerm,
    status,
    department,
  });

  const employees = employeePage?.content ?? [];
  const totalItems = employeePage?.totalElements ?? 0;
  const totalPages = employeePage?.totalPages ?? 0;

  const hasActiveFilters =
    !!searchTerm || statusFilter !== 'all' || departmentFilter !== 'all';

  // "No employees at all" (as opposed to a filter yielding nothing) is the only
  // case for the full-page empty state; a filtered-empty result is handled by
  // the table's own empty row.
  const showEmptyState = !isLoading && totalItems === 0 && !hasActiveFilters;

  return (
    <OrgGuard
      isLoading={isUserLoading}
      error={userError ?? employeesError}
      organizationId={user?.defaultOrganizationId}
    >
      {showEmptyState ? (
        <EmployeeEmptyState />
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <PageHeader
            title="Employee Management"
            description="Manage and view all employees in your organization"
          />
          <EmployeeTable
            employees={employees}
            isLoading={isLoading}
            isError={!!employeesError}
            manual={{
              page,
              pageSize,
              totalItems,
              totalPages,
              isFetching,
              onPageChange: setPage,
              onPageSizeChange: (n) => {
                setPageSize(n);
                setPage(1);
              },
              searchValue: search,
              onSearchChange: (q) => {
                setSearch(q);
                setPage(1);
              },
              filterValues: {
                status: statusFilter,
                department: departmentFilter,
              },
              onFilterChange: (id, value) => {
                if (id === 'status') setStatusFilter(value);
                else if (id === 'department') setDepartmentFilter(value);
                setPage(1);
              },
            }}
          />
        </div>
      )}
    </OrgGuard>
  );
}
