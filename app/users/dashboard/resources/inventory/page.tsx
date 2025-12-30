'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout, Pagination, SearchAndFilter } from '@/components/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  MapPin,
  TrendingDown,
  AlertTriangle,
  Box,
} from 'lucide-react';
import {
  InventoryFilters,
  InventoryCategory,
  inventoryCategoryLabels,
  getStockStatus,
} from '@/types/resource';
import {
  mockInventoryItems,
  getVendorById,
} from '@/components/shared/mock-data';

export default function InventoryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
    category: 'all',
    locationId: 'all',
    lowStock: false,
    outOfStock: false,
  });

  // Filter inventory items
  const filteredItems = mockInventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.itemId.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.description.toLowerCase().includes(filters.search.toLowerCase());

    const matchesCategory =
      filters.category === 'all' || item.category === filters.category;
    const matchesLocation =
      filters.locationId === 'all' || item.locationId === filters.locationId;
    const matchesLowStock = !filters.lowStock || getStockStatus(item) === 'low';
    const matchesOutOfStock =
      !filters.outOfStock || getStockStatus(item) === 'out-of-stock';

    return (
      matchesSearch &&
      matchesCategory &&
      matchesLocation &&
      matchesLowStock &&
      matchesOutOfStock
    );
  });

  // Reset to page 1 when filters change
  const handleFilterChange = (
    key: keyof InventoryFilters,
    value: string | number | boolean
  ) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Calculate stats
  const totalItems = mockInventoryItems.length;
  const totalValue = mockInventoryItems.reduce(
    (sum, item) => sum + item.totalValue,
    0
  );
  const lowStockItems = mockInventoryItems.filter(
    (item) => getStockStatus(item) === 'low'
  ).length;
  const outOfStockItems = mockInventoryItems.filter(
    (item) => getStockStatus(item) === 'out-of-stock'
  ).length;

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inventory</h1>
            <p className="text-muted-foreground mt-1">
              Manage consumable materials and stock levels
            </p>
          </div>
          <Button asChild>
            <Link href="/users/dashboard/resources/inventory/new">
              <Package className="mr-2 h-4 w-4" />
              Add Inventory Item
            </Link>
          </Button>
        </div>
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Box className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-muted-foreground text-xs">In inventory</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{(totalValue / 100_000).toFixed(2)}L
              </div>
              <p className="text-muted-foreground text-xs">
                Current inventory value
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {lowStockItems}
              </div>
              <p className="text-muted-foreground text-xs">
                Items need reorder
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Out of Stock
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {outOfStockItems}
              </div>
              <p className="text-muted-foreground text-xs">Critical items</p>
            </CardContent>
          </Card>
        </div>
        {/* Filters */}
        <SearchAndFilter
          variant="card"
          searchValue={filters.search}
          onSearchChange={(value) => handleFilterChange('search', value)}
          searchPlaceholder="Search inventory..."
          hasActiveFilters={Boolean(
            filters.search ||
              filters.category !== 'all' ||
              filters.locationId !== 'all' ||
              filters.lowStock ||
              filters.outOfStock
          )}
          onClearFilters={() => {
            setFilters({
              search: '',
              category: 'all',
              locationId: 'all',
              lowStock: false,
              outOfStock: false,
            });
            setCurrentPage(1);
          }}
          filters={[
            {
              placeholder: 'Category',
              options: [
                { value: 'all', label: 'All Categories' },
                ...Object.entries(inventoryCategoryLabels).map(
                  ([value, label]) => ({
                    value,
                    label,
                  })
                ),
              ],
              value: filters.category,
              onChange: (value) =>
                handleFilterChange(
                  'category',
                  value as InventoryCategory | 'all'
                ),
            },
            {
              placeholder: 'Location',
              options: [
                { value: 'all', label: 'All Locations' },
                { value: '1', label: 'Godown A' },
                { value: '2', label: 'Project Site - Gateway Plaza' },
                { value: '3', label: 'Head Office Warehouse' },
              ],
              value: filters.locationId.toString(),
              onChange: (value) =>
                handleFilterChange(
                  'locationId',
                  value === 'all' ? 'all' : Number.parseInt(value)
                ),
            },
          ]}
        />

        {/* Stock Status Quick Filters */}
        <div className="flex gap-2">
          <Button
            variant={filters.lowStock ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilters({
                ...filters,
                lowStock: !filters.lowStock,
                outOfStock: false,
              });
              setCurrentPage(1);
            }}
          >
            <TrendingDown className="mr-2 h-4 w-4" />
            Low Stock
          </Button>
          <Button
            variant={filters.outOfStock ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => {
              setFilters({
                ...filters,
                outOfStock: !filters.outOfStock,
                lowStock: false,
              });
              setCurrentPage(1);
            }}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Out of Stock
          </Button>
        </div>

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to{' '}
            {Math.min(endIndex, filteredItems.length)} of {filteredItems.length}{' '}
            items
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
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Inventory List */}
        {filteredItems.length > 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {paginatedItems.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const stockPercentage =
                    (item.quantity / item.maxStockLevel) * 100;
                  return (
                    <Link
                      key={item.id}
                      href={`/users/dashboard/resources/inventory/${item.id}`}
                      className="block"
                    >
                      <div className="hover:bg-accent/50 flex items-start gap-4 rounded-lg border p-4 transition-colors">
                        {/* Icon */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-cyan-600 text-white">
                          <Package className="h-6 w-6" />
                        </div>
                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <h3 className="text-lg font-semibold">
                                  {item.name}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className={
                                    {
                                      optimal:
                                        'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
                                      low: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
                                      'out-of-stock':
                                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
                                      excess:
                                        'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
                                    }[stockStatus] ||
                                    'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                  }
                                >
                                  {{
                                    'out-of-stock': 'Out of Stock',
                                    low: 'Low Stock',
                                    optimal: 'Optimal',
                                    excess: 'Excess',
                                  }[stockStatus] || 'Unknown'}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground mb-2 text-sm">
                                {item.description}
                              </p>

                              <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Box className="h-3.5 w-3.5" />
                                  <span>{item.itemId}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span>{item.location.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">Category:</span>
                                  <span>
                                    {
                                      inventoryCategoryLabels[
                                        item.category as InventoryCategory
                                      ]
                                    }
                                  </span>
                                </div>
                                {item.vendorId &&
                                  (() => {
                                    const vendor = getVendorById(item.vendorId);
                                    return vendor ? (
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium">
                                          Vendor:
                                        </span>
                                        <span>{vendor.companyName}</span>
                                      </div>
                                    ) : null;
                                  })()}
                              </div>
                            </div>
                            {/* Right Side Info */}
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <div className="text-right">
                                <div className="text-lg font-semibold">
                                  {item.quantity} {item.unit}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  Min: {item.minStockLevel} | Max:{' '}
                                  {item.maxStockLevel}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  ₹{(item.totalValue / 1000).toFixed(1)}K
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  @₹{item.unitPrice}/{item.unit}
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Stock Level Bar */}
                          <div className="mt-3">
                            <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
                              <span>Stock Level</span>
                              <span>
                                {stockPercentage.toFixed(0)}% of capacity
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                              <div
                                className={`h-2 rounded-full ${getStockColor(stockStatus)}`}
                                style={{
                                  width: `${Math.min(stockPercentage, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
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
              <Package className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
              <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                No inventory items found
              </h3>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                Try adjusting your filters to find what you&apos;re looking for.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

const getStockColor = (status: string) => {
  switch (status) {
    case 'out-of-stock': {
      return 'bg-red-500';
    }
    case 'low': {
      return 'bg-orange-500';
    }
    case 'optimal': {
      return 'bg-green-500';
    }
    case 'excess': {
      return 'bg-blue-500';
    }
    default: {
      return 'bg-gray-500';
    }
  }
};
