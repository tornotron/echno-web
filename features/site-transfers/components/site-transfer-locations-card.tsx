'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { MapPin } from 'lucide-react';
import type { SiteTransfer } from '@tornotron/echno-core/site-transfers/types';

interface SiteTransferLocationsCardProps {
  transfer: SiteTransfer;
}

export function SiteTransferLocationsCard({
  transfer,
}: SiteTransferLocationsCardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" />
            Sending Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Sending Person</span>
            <span className="font-medium">{transfer.sendingPerson.name}</span>
          </div>
          {transfer.sendingProjectName && (
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Project</span>
              <span className="font-medium">{transfer.sendingProjectName}</span>
            </div>
          )}
          {transfer.sendingStorageLocationName ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Storage Location</span>
              <span className="font-medium">
                {transfer.sendingStorageLocationName}
              </span>
            </div>
          ) : (
            !transfer.sendingProjectName && (
              <p className="text-muted-foreground text-xs">
                No location details recorded.
              </p>
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" />
            Receiving Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {transfer.receivingProjectName && (
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Project</span>
              <span className="font-medium">
                {transfer.receivingProjectName}
              </span>
            </div>
          )}
          {transfer.receivingStorageLocationName ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Storage Location</span>
              <span className="font-medium">
                {transfer.receivingStorageLocationName}
              </span>
            </div>
          ) : (
            !transfer.receivingProjectName && (
              <p className="text-muted-foreground text-xs">
                No receiving location details recorded.
              </p>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
