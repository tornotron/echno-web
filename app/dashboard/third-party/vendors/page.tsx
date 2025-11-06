'use client';

import { useState } from 'react';
import { AppLayout, Pagination } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Package,
  Search,
  Plus,
  Eye,
  Edit,
  Download,
  Building2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Star,
  Filter,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { mockVendors } from '@/lib/mock-data';

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

  // Filter data
  const filteredVendors = mockVendors.filter((vendor) => {
    const matchesSearch =
      vendor.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.vendorId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    const matchesType = typeFilter === 'all' || vendor.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVendors = filteredVendors.slice(startIndex, startIndex + itemsPerPage);

  // Statistics
  const stats = {
    total: mockVendors.length,
    active: mockVendors.filter((v) => v.status === 'active').length,
    totalPurchase: mockVendors.reduce((sum, v) => sum + v.totalPurchaseValue, 0),
    totalOutstanding: mockVendors.reduce((sum, v) => sum + v.totalOutstanding, 0),
  };

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-3">
              <Package className="h-8 w-8" />
              <span>Vendor Management</span>
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Manage suppliers and service providers
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/third-party/vendors/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Vendors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.total}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
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
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.active}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
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
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  ₹{(stats.totalPurchase / 1000000).toFixed(1)}M
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
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
                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  ₹{(stats.totalOutstanding / 100000).toFixed(1)}L
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                Pending payments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <CardTitle>Search & Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Search by company, ID, or contact..."
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
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="blacklisted">Blacklisted</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Showing results and rows per page */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredVendors.length)} of{' '}
            {filteredVendors.length} {filteredVendors.length === 1 ? 'record' : 'records'}
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Rows per page:</span>
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
                    <TableHead>Vendor ID</TableHead>
                    <TableHead>Company & Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Purchase Value</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-zinc-500">
                        No vendor records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.vendorId}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center shrink-0">
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
                              <Badge key={idx} variant="secondary" className="text-xs">
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
                            ₹{(vendor.totalPurchaseValue / 100000).toFixed(1)}L
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
                            {statusLabels[vendor.status as keyof typeof statusLabels]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <div className="flex justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                                    <Link href={`/dashboard/third-party/vendors/${vendor.id}`}>
                                      <Eye className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Details</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                                    <Link href={`/dashboard/third-party/vendors/${vendor.id}/edit`}>
                                      <Edit className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Vendor</TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
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
