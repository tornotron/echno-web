'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from "@/components/common/app-layout";
import { Separator } from '@/components/ui/separator';
import {
  Cog,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  DollarSign,
  Wrench,
  Shield,
  Fuel,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  FileText,
  Download,
  Truck,
  User,
  Building2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  assetStatusLabels,
  assetConditionLabels,
  assetTypeLabels,
  getAssetStatusBadgeColor,
  getAssetConditionBadgeColor,
  calculateUtilization,
  calculateDepreciation,
  isMaintenanceDue
} from '@/types/resource';
import { mockAssets } from '@/components/shared/mock-data';
import { toast } from 'sonner';
import { AssetTransferModal } from "@/features/assets/asset-transfer-modal";

// The original getStatusColor function was not used.
// The instruction implies using a helper from outside, and getAssetStatusBadgeColor is already imported.
// So, we remove the local getStatusColor and ensure getAssetStatusBadgeColor is used where appropriate.
// The provided snippet for `getStatusColor` definition was malformed, so assuming the intent was to remove it.

const getUtilizationColor = (utilization: number) => {
  if (utilization >= 80) return 'bg-red-500';
  if (utilization >= 60) return 'bg-orange-500';
  if (utilization >= 40) return 'bg-yellow-500';
  return 'bg-green-500';
};

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = Number.parseInt(params.id as string);
  const asset = mockAssets.find(a => a.id === assetId);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [now] = useState(() => Date.now());

  const daysUntilMaintenance = asset?.nextMaintenanceDate
    ? Math.floor((asset.nextMaintenanceDate.getTime() - now) / (1000 * 60 * 60 * 24))
    : null;

  const handleDelete = useCallback(() => {
    if (confirm('Are you sure you want to delete this asset?')) {
      toast.success('Asset deleted successfully');
      router.push('/dashboard/resources/assets');
    }
  }, [router]);

  if (!asset) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Asset Not Found
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                The asset you&apos;re looking for doesn&apos;t exist.
              </p>
              <Link href="/dashboard/resources/assets">
                <Button>Back to Assets</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const utilization = calculateUtilization(asset.usageHours, asset.maxUsageHours);
  const currentValue = calculateDepreciation(asset.purchasePrice, asset.purchaseDate, asset.depreciationRate);
  const maintenanceDue = isMaintenanceDue(asset);
  

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {asset.name}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {asset.assetId}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/resources/assets/${asset.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Status Badges & Alerts */}
        <div className="flex flex-wrap gap-2">
          <Badge className={getAssetStatusBadgeColor(asset.status)}>
            {assetStatusLabels[asset.status]}
          </Badge>
          <Badge className={getAssetConditionBadgeColor(asset.condition)}>
            {assetConditionLabels[asset.condition]}
          </Badge>
          <Badge variant="outline">
            {assetTypeLabels[asset.type]}
          </Badge>
          {maintenanceDue && (
            <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400">
              <AlertCircle className="h-3 w-3 mr-1" />
              Maintenance Due in {daysUntilMaintenance}d
            </Badge>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column - Main Info (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-500 mb-1">
                    Description
                  </h4>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {asset.description || 'No description provided'}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mb-1">
                      <Truck className="h-4 w-4" />
                      <span>Manufacturer</span>
                    </div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {asset.manufacturer || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mb-1">
                      <Cog className="h-4 w-4" />
                      <span>Model</span>
                    </div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {asset.model || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mb-1">
                      <FileText className="h-4 w-4" />
                      <span>Serial Number</span>
                    </div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {asset.serialNumber || 'N/A'}
                    </p>
                  </div>
                  {asset.registrationNumber && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mb-1">
                        <Shield className="h-4 w-4" />
                        <span>Registration No.</span>
                      </div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {asset.registrationNumber}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span>Purchase Price</span>
                    </div>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      ₹{(asset.purchasePrice / 100_000).toFixed(2)}L
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      {format(asset.purchaseDate, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mb-1">
                      <TrendingDown className="h-4 w-4" />
                      <span>Current Value</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ₹{(currentValue / 100_000).toFixed(2)}L
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      {asset.depreciationRate}% annual depreciation
                    </p>
                  </div>
                </div>

                {asset.warrantyExpiry && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mb-1">
                        <Shield className="h-4 w-4" />
                        <span>Warranty</span>
                      </div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        Valid until {format(asset.warrantyExpiry, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Operational Details */}
            <Card>
              <CardHeader>
                <CardTitle>Operational Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {asset.usageHours !== undefined && asset.maxUsageHours && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500">
                        <Clock className="h-4 w-4" />
                        <span>Usage Hours</span>
                      </div>
                      <span className="text-sm font-medium">
                        {asset.usageHours} / {asset.maxUsageHours} hrs
                      </span>
                    </div>
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${getUtilizationColor(utilization)}`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                      {utilization.toFixed(1)}% utilization
                    </p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  {asset.fuelType && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mb-1">
                        <Fuel className="h-4 w-4" />
                        <span>Fuel Type</span>
                      </div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {asset.fuelType}
                      </p>
                    </div>
                  )}
                  {asset.maintenanceSchedule && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mb-1">
                        <Wrench className="h-4 w-4" />
                        <span>Maintenance Schedule</span>
                      </div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {asset.maintenanceSchedule}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Maintenance History */}
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {asset.lastMaintenanceDate && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mb-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Last Maintenance</span>
                      </div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {format(asset.lastMaintenanceDate, 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  {asset.nextMaintenanceDate && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span>Next Maintenance</span>
                      </div>
                      <p className={`font-medium ${
                        maintenanceDue 
                          ? 'text-orange-600 dark:text-orange-400' 
                          : 'text-zinc-900 dark:text-zinc-100'
                      }`}>
                        {format(asset.nextMaintenanceDate, 'MMM d, yyyy')}
                        {maintenanceDue && ' (Due Soon!)'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Insurance Details */}
            {asset.insuranceProvider && (
              <Card>
                <CardHeader>
                  <CardTitle>Insurance Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mb-1">
                        <Shield className="h-4 w-4" />
                        <span>Provider</span>
                      </div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {asset.insuranceProvider}
                      </p>
                    </div>
                    {asset.policyNumber && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mb-1">
                          <FileText className="h-4 w-4" />
                          <span>Policy Number</span>
                        </div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {asset.policyNumber}
                        </p>
                      </div>
                    )}
                    {asset.insuranceExpiry && (
                      <div className="col-span-2">
                        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mb-1">
                          <Calendar className="h-4 w-4" />
                          <span>Expiry Date</span>
                        </div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {format(asset.insuranceExpiry, 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {asset.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {asset.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Quick Info */}
          <div className="space-y-6">
            {/* Location & Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Location & Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mb-1">
                    <MapPin className="h-4 w-4" />
                    <span>Current Location</span>
                  </div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {asset.location.name}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {asset.location.address}
                  </p>
                </div>

                {asset.assignedTo && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mb-1">
                        <User className="h-4 w-4" />
                        <span>Assigned To</span>
                      </div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {asset.assignedTo}
                      </p>
                    </div>
                  </>
                )}

                {asset.assignedProject && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500 mb-1">
                        <Building2 className="h-4 w-4" />
                        <span>Assigned Project</span>
                      </div>
                      <p className="font-medium text-blue-600 dark:text-blue-400">
                        {asset.assignedProject}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Age</span>
                  <span className="font-medium">
                    {Math.floor((now - asset.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Category</span>
                  <span className="font-medium">{asset.category}</span>
                </div>
                {asset.specifications && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 block">
                        Specifications
                      </span>
                      <div className="space-y-1">
                        {Object.entries(asset.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-zinc-500">{key}:</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {value as string}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowTransferModal(true)}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Transfer Asset
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Wrench className="mr-2 h-4 w-4" />
                  Schedule Maintenance
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  View Documents
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Location History */}
        {asset.locationHistory && asset.locationHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Location Transfer History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...asset.locationHistory]
                  // eslint-disable-next-line unicorn/no-array-sort
                  .sort((a, b) => b.transferDate.getTime() - a.transferDate.getTime())
                  .map((history, index) => (
                  <div key={history.id} className="relative pl-6 pb-4 last:pb-0">
                    {index !== asset.locationHistory!.length - 1 && (
                      <div className="absolute left-2 top-6 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700" />
                    )}
                    <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-blue-500 bg-white dark:bg-zinc-900" />
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {history.fromLocation && (
                              <>
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                  {history.fromLocation.name}
                                </span>
                                <ArrowRight className="h-3 w-3 text-zinc-400" />
                              </>
                            )}
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              {history.toLocation?.name}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                            {history.reason}
                          </p>
                          {history.notes && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1 italic">
                              {history.notes}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(history.transferDate, 'MMM dd, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {history.transferredBy}
                            </span>
                          </div>
                          {(history.newAssignedTo || history.newProject) && (
                            <div className="mt-2 flex gap-2 flex-wrap">
                              {history.newAssignedTo && (
                                <Badge variant="outline" className="text-xs">
                                  Assigned to: {history.newAssignedTo}
                                </Badge>
                              )}
                              {history.newProject && (
                                <Badge variant="outline" className="text-xs">
                                  Project: {history.newProject}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <AssetTransferModal
          asset={asset}
          onClose={() => setShowTransferModal(false)}
          onTransfer={() => {
            // In real app, refresh asset data
            router.refresh();
          }}
        />
      )}
    </AppLayout>
  );
}
