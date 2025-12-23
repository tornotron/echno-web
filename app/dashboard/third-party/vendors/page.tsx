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
  CardTitle,
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
  Package,
  Plus,
  Download,
  Building2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { mockVendors } from '@/components/shared/mock-data';

const typeLabels = {
  material: 'Material Supplier',
  equipment: 'Equipment',
  service: 'Service Provider',
  transport: 'Transport',
  mixed: 'Mixed',
};

const statusColors = {
  active: 'green',
  inactive: 'zinc',
  blacklisted: 'red',
  pending: 'orange',
};

const statusLabels = {
  active: 'Active',
  inactive: 'Inactive',
  blacklisted: 'Blacklisted',
  pending: 'Pending',
};

export default function VendorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const hasActiveFilters =
    statusFilter !== 'all' || typeFilter !== 'all' || searchQuery !== '';

  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setSearchQuery('');
  };

  // Filter data
  const filteredVendors = mockVendors.filter((vendor) => {
    const matchesSearch =
      vendor.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.vendorId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || vendor.status === statusFilter;
    const matchesType = typeFilter === 'all' || vendor.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVendors = filteredVendors.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedVendors.map((v) => v.id));
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
    paginatedVendors.length > 0 &&
    selectedIds.length === paginatedVendors.length;
  const isSomeSelected =
    selectedIds.length > 0 && selectedIds.length < paginatedVendors.length;

  // Statistics
  const stats = {
    total: mockVendors.length,
    active: mockVendors.filter((v) => v.status === 'active').length,
    totalPurchase: mockVendors.reduce(
      (sum, v) => sum + v.totalPurchaseValue,
      0
    ),
    totalOutstanding: mockVendors.reduce(
      (sum, v) => sum + v.totalOutstanding,
      0
    ),
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center space-x-3 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              <Package className="h-8 w-8" />
              <span>Vendor Management</span>
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Manage suppliers and service providers
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/third-party/vendors/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Vendor
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Vendors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.total}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                Registered vendors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Vendors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.active}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Purchase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <ShoppingCart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  ₹{(stats.totalPurchase / 1_000_000).toFixed(1)}M
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                Lifetime value
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
                  ₹{(stats.totalOutstanding / 100_000).toFixed(1)}L
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
          searchPlaceholder="Search by company, ID, or contact..."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          filters={[
            {
              placeholder: 'Status',
              options: [
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'pending', label: 'Pending' },
                { value: 'blacklisted', label: 'Blacklisted' },
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
                { value: 'material', label: 'Material' },
                { value: 'equipment', label: 'Equipment' },
                { value: 'service', label: 'Service' },
                { value: 'transport', label: 'Transport' },
                { value: 'mixed', label: 'Mixed' },
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
            {Math.min(startIndex + itemsPerPage, filteredVendors.length)} of{' '}
            {filteredVendors.length}{' '}
            {filteredVendors.length === 1 ? 'record' : 'records'}
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
                  <TableHead>Company & Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Purchase Value</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVendors.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-zinc-500"
                    >
                      No vendor records found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedVendors.map((vendor) => (
                    <TableRow
                      key={vendor.id}
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      onClick={() =>
                        (globalThis.location.href = `/dashboard/third-party/vendors/${vendor.id}`)
                      }
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(vendor.id)}
                          onCheckedChange={(checked) =>
                            handleSelectOne(vendor.id, checked as boolean)
                          }
                          aria-label={`Select ${vendor.companyName}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-purple-600">
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {vendor.companyName}
                            </p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-500">
                              {vendor.contactPerson}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {typeLabels[vendor.type as keyof typeof typeLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {vendor.category.slice(0, 2).map((cat, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                            >
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{vendor.rating}</span>
                        </div>
                        <div className="text-xs text-zinc-500">
                          {vendor.onTimeDeliveryRate}% on-time
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                          ₹{(vendor.totalPurchaseValue / 100_000).toFixed(1)}L
                        </div>
                        <div className="text-xs text-zinc-500">
                          {vendor.totalOrders} orders
                        </div>
                      </TableCell>
                      <TableCell>
                        {vendor.totalOutstanding > 0 ? (
                          <span className="font-semibold text-orange-600 dark:text-orange-400">
                            ₹{(vendor.totalOutstanding / 1000).toFixed(0)}K
                          </span>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`bg-${statusColors[vendor.status as keyof typeof statusColors]}-100 text-${statusColors[vendor.status as keyof typeof statusColors]}-700 dark:bg-${statusColors[vendor.status as keyof typeof statusColors]}-900 dark:text-${statusColors[vendor.status as keyof typeof statusColors]}-300`}
                        >
                          {
                            statusLabels[
                              vendor.status as keyof typeof statusLabels
                            ]
                          }
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {filteredVendors.length > 0 && (
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
