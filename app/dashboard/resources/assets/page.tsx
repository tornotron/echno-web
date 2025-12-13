'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout, Pagination, FiltersCard } from '@/components/common';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Cog,
  Search, 
  Filter,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Wrench,
  Truck,
  Calendar,
  DollarSign,
  Activity,
  Shield,
  Fuel,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { 
  Asset,
  AssetType,
  AssetStatus,
  AssetCondition,
  assetTypeLabels,
  assetStatusLabels,
  assetConditionLabels,
  getAssetStatusBadgeColor,
  getAssetConditionBadgeColor,
  calculateUtilization,
  isMaintenanceDue
} from '@/types/resource';
import { mockAssets, mockLocations } from '@/components/shared/mock-data';

export default function AssetsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AssetType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all');
  const [conditionFilter, setConditionFilter] = useState<AssetCondition | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState<number | 'all'>('all');
  const [maintenanceDueFilter, setMaintenanceDueFilter] = useState(false);

  // Filter assets
  const filteredAssets = useMemo(() => {
    return mockAssets.filter((asset) => {
      const matchesSearch = 
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.assetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.model?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'all' || asset.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
      const matchesCondition = conditionFilter === 'all' || asset.condition === conditionFilter;
      const matchesLocation = locationFilter === 'all' || asset.locationId === locationFilter;
      const matchesMaintenanceDue = !maintenanceDueFilter || isMaintenanceDue(asset);

      return matchesSearch && matchesType && matchesStatus && matchesCondition && 
             matchesLocation && matchesMaintenanceDue;
    });
  }, [searchQuery, typeFilter, statusFilter, conditionFilter, locationFilter, maintenanceDueFilter]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, statusFilter, conditionFilter, locationFilter, maintenanceDueFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

  // Calculate stats
  const totalAssets = mockAssets.length;
  const totalValue = mockAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const inUseAssets = mockAssets.filter(asset => asset.status === 'in-use').length;
  const maintenanceDueAssets = mockAssets.filter(asset => isMaintenanceDue(asset)).length;
  const underRepairAssets = mockAssets.filter(asset => asset.status === 'repair' || asset.status === 'maintenance').length;

  const hasActiveFilters =
    searchQuery || typeFilter !== 'all' || statusFilter !== 'all' || 
    conditionFilter !== 'all' || locationFilter !== 'all' || maintenanceDueFilter;

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setConditionFilter('all');
    setLocationFilter('all');
    setMaintenanceDueFilter(false);
    setCurrentPage(1);
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Assets
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1">
              Track equipment, vehicles, and machinery
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/resources/assets/new">
              <Cog className="mr-2 h-4 w-4" />
              Register Asset
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Assets</CardTitle>
              <Cog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAssets}</div>
              <p className="text-xs text-muted-foreground">Registered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(totalValue / 10000000).toFixed(1)}Cr</div>
              <p className="text-xs text-muted-foreground">Current value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">In Use</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{inUseAssets}</div>
              <p className="text-xs text-muted-foreground">Active assets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Maintenance Due</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{maintenanceDueAssets}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Under Repair</CardTitle>
              <Wrench className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{underRepairAssets}</div>
              <p className="text-xs text-muted-foreground">In workshop</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <FiltersCard
            title="Search & Filters"
            searchPlaceholder="Search assets by name, ID, manufacturer..."
            searchValue={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value);
              setCurrentPage(1);
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:flex-1 sm:min-w-[200px]">
                <Select
                  value={typeFilter}
                  onValueChange={(value) => {
                    setTypeFilter(value as AssetType | 'all');
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Asset Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="heavy-equipment">Heavy Equipment</SelectItem>
                    <SelectItem value="light-equipment">Light Equipment</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="machinery">Machinery</SelectItem>
                    <SelectItem value="generator">Generator</SelectItem>
                    <SelectItem value="computer">Computer & IT</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:flex-1 sm:min-w-[200px]">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as AssetStatus | 'all');
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in-use">In Use</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="repair">Under Repair</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="disposed">Disposed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:flex-1 sm:min-w-[200px]">
                <Select
                  value={conditionFilter}
                  onValueChange={(value) => {
                    setConditionFilter(value as AssetCondition | 'all');
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Conditions</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:flex-1 sm:min-w-[200px]">
                <Select
                  value={locationFilter === 'all' ? 'all' : locationFilter.toString()}
                  onValueChange={(value) => {
                    setLocationFilter(value === 'all' ? 'all' : parseInt(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {mockLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            )}
          </FiltersCard>
        </div>

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredAssets.length)} of{' '}
            {filteredAssets.length} assets
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

        {/* Assets Grid */}
        {filteredAssets.length > 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {paginatedAssets.map((asset) => {
                  const utilization = calculateUtilization(asset.usageHours, asset.maxUsageHours);
                  const maintenanceDue = isMaintenanceDue(asset);
                  const daysUntilMaintenance = asset.nextMaintenanceDate
                    ? Math.floor(
                        (asset.nextMaintenanceDate.getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : null;

                  return (
                    <Link 
                      key={asset.id} 
                      href={`/dashboard/resources/assets/${asset.id}`}
                      className="block"
                    >
                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          {/* Left: Asset Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                                <Cog className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                    {asset.name}
                                  </h3>
                                  <span className="text-xs text-zinc-500 dark:text-zinc-500">
                                    {asset.assetId}
                                  </span>
                                  {maintenanceDue && (
                                    <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Maintenance Due
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-1">
                                  {asset.description}
                                </p>
                                <div className="flex items-center gap-4 mt-2 flex-wrap">
                                  <div className="flex items-center text-xs text-zinc-500">
                                    <Truck className="h-3 w-3 mr-1" />
                                    {asset.manufacturer} {asset.model}
                                  </div>
                                  {asset.registrationNumber && (
                                    <div className="flex items-center text-xs text-zinc-500">
                                      <Shield className="h-3 w-3 mr-1" />
                                      {asset.registrationNumber}
                                    </div>
                                  )}
                                  <div className="flex items-center text-xs text-zinc-500">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {asset.location.name}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Middle: Status & Condition */}
                          <div className="flex gap-2">
                            <Badge className={getAssetStatusBadgeColor(asset.status)}>
                              {assetStatusLabels[asset.status]}
                            </Badge>
                            <Badge className={getAssetConditionBadgeColor(asset.condition)}>
                              {assetConditionLabels[asset.condition]}
                            </Badge>
                          </div>

                          {/* Right: Metrics */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:w-auto">
                            <div className="text-center">
                              <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-1">
                                Value
                              </div>
                              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                ₹{(asset.currentValue / 100000).toFixed(1)}L
                              </div>
                            </div>
                            {asset.usageHours && asset.maxUsageHours && (
                              <div className="text-center">
                                <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-1">
                                  Utilization
                                </div>
                                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                  {utilization.toFixed(0)}%
                                </div>
                              </div>
                            )}
                            {asset.nextMaintenanceDate && (
                              <div className="text-center">
                                <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-1">
                                  Next Service
                                </div>
                                <div className={`text-sm font-semibold ${
                                  maintenanceDue 
                                    ? 'text-orange-600 dark:text-orange-400' 
                                    : 'text-zinc-900 dark:text-zinc-100'
                                }`}>
                                  {daysUntilMaintenance !== null && daysUntilMaintenance >= 0
                                    ? `${daysUntilMaintenance}d`
                                    : 'Overdue'}
                                </div>
                              </div>
                            )}
                            {asset.assignedProject && (
                              <div className="text-center">
                                <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-1">
                                  Project
                                </div>
                                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 truncate">
                                  {asset.assignedProject}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* View Button */}
                          <Button variant="ghost" size="sm" className="shrink-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Utilization Bar (if applicable) */}
                        {asset.usageHours && asset.maxUsageHours && (
                          <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500 mb-1">
                              <span>Usage Hours: {asset.usageHours} / {asset.maxUsageHours}</span>
                              <span>{utilization.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  utilization >= 80
                                    ? 'bg-red-500'
                                    : utilization >= 60
                                    ? 'bg-orange-500'
                                    : utilization >= 40
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(utilization, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
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
            <CardContent className="text-center py-12">
              <Cog className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                No assets found
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Get started by registering your first asset'}
              </p>
              {!hasActiveFilters && (
                <Button asChild>
                  <Link href="/dashboard/resources/assets/new">
                    <Cog className="mr-2 h-4 w-4" />
                    Register Asset
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
