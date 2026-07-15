import Link from 'next/link';
import { routes } from '@/nav';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import {
  MapPin,
  Building2,
  Warehouse,
  Home,
  Box,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  STORAGE_LOCATION_TYPE_LABELS,
  StorageLocationType,
  type StorageLocation,
} from '@tornotron/echno-core/storage-locations/types';

const getLocationIcon = (type: StorageLocationType) => {
  switch (type) {
    case StorageLocationType.GODOWN: {
      return <Warehouse className="h-5 w-5" />;
    }
    case StorageLocationType.HEAD_OFFICE: {
      return <Building2 className="h-5 w-5" />;
    }
    case StorageLocationType.PROJECT_SITE: {
      return <Home className="h-5 w-5" />;
    }
    case StorageLocationType.WAREHOUSE: {
      return <Box className="h-5 w-5" />;
    }
    default: {
      return <MapPin className="h-5 w-5" />;
    }
  }
};

const getTypeColor = (type: StorageLocationType) => {
  switch (type) {
    case StorageLocationType.GODOWN: {
      return 'bg-blue-100 text-blue-600';
    }
    case StorageLocationType.HEAD_OFFICE: {
      return 'bg-purple-100 text-purple-600';
    }
    case StorageLocationType.PROJECT_SITE: {
      return 'bg-green-100 text-green-600';
    }
    case StorageLocationType.WAREHOUSE: {
      return 'bg-yellow-100 text-yellow-600';
    }
    case StorageLocationType.PROCESSING_PLANT: {
      return 'bg-orange-100 text-orange-600';
    }
    default: {
      return 'bg-gray-100 text-gray-600';
    }
  }
};

interface StorageLocationCardProps {
  location: StorageLocation;
}

export function StorageLocationCard({ location }: StorageLocationCardProps) {
  return (
    <Link
      href={routes.resources.storageLocations.detail(location.id).href}
      className="block"
    >
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`rounded-lg p-2 ${getTypeColor(location.locationType)}`}
              >
                {getLocationIcon(location.locationType)}
              </div>
              <div>
                <CardTitle className="text-base">
                  {location.locationName}
                </CardTitle>
                <Badge variant="outline" className="mt-1">
                  {STORAGE_LOCATION_TYPE_LABELS[location.locationType]}
                </Badge>
              </div>
            </div>
            <Badge variant={location.active ? 'default' : 'secondary'}>
              {location.active ? (
                <>
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                </>
              ) : (
                <>
                  <XCircle className="mr-1 h-3 w-3" /> Inactive
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {location.address && (
            <div className="text-muted-foreground text-sm">
              <MapPin className="mr-1 inline h-3 w-3" />
              {location.address}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-muted-foreground text-xs">Capacity</div>
              <div className="text-lg font-bold">
                {location.capacity?.toLocaleString() ?? '—'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Items Stored</div>
              <div className="text-lg font-bold text-blue-600">
                {location.storageItemsCount ?? 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
