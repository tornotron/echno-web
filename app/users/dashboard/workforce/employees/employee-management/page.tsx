'use client';

import { useState } from 'react';
import { PageHeader, OrgGuard, ActiveFilterChip } from '@/components/common';
import {
  useEmployeesPage,
  useSubordinates,
} from '@tornotron/echno-core/employee/hooks';
import { useEmployeeFilterFromParams } from '@/hooks/use-employee-filter';
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

  /*
    The one filter this directory takes off the URL: a manager's direct
    reports, linked from the "Reporting Manager" card on a profile. The paged
    listing has no `managerId` parameter, and narrowing a page of it in the
    browser would hide every report outside the fetched page, so the filter
    switches the fetch to the unpaged subordinates endpoint instead and shows
    the whole set. No accessor is declared: the server does the narrowing.
  */
  const { employeeId: managerId, chip } = useEmployeeFilterFromParams({
    roles: { manager: {} },
  });
  const byManager = managerId != null;

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
  const {
    data: subordinates = [],
    isLoading: isSubordinatesLoading,
    error: subordinatesError,
  } = useSubordinates(managerId ?? undefined);

  const employees = byManager ? subordinates : (employeePage?.content ?? []);
  const totalItems = byManager
    ? subordinates.length
    : (employeePage?.totalElements ?? 0);
  const totalPages = employeePage?.totalPages ?? 0;
  const listLoading = byManager ? isSubordinatesLoading : isLoading;
  const listError = byManager ? subordinatesError : employeesError;

  const hasActiveFilters =
    byManager ||
    !!searchTerm ||
    statusFilter !== 'all' ||
    departmentFilter !== 'all';

  // "No employees at all" (as opposed to a filter yielding nothing) is the only
  // case for the full-page empty state; a filtered-empty result is handled by
  // the table's own empty row.
  const showEmptyState = !listLoading && totalItems === 0 && !hasActiveFilters;

  return (
    <OrgGuard
      isLoading={isUserLoading}
      error={userError ?? listError}
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
          {chip && <ActiveFilterChip {...chip} />}
          <EmployeeTable
            employees={employees}
            isLoading={listLoading}
            isError={!!listError}
            manual={
              byManager
                ? undefined
                : {
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
                  }
            }
          />
        </div>
      )}
    </OrgGuard>
  );
}
