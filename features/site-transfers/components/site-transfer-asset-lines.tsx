'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { Cog, Loader2, Trash2 } from 'lucide-react';
import { useSendableAssets } from '@tornotron/echno-core/site-transfers/hooks';
import type { SiteTransferAssetOption } from '@tornotron/echno-core/site-transfers/types';

/** One asset chosen to travel on the transfer. */
export interface SiteTransferAssetRow {
  assetId: number;
  assetCode: string | null;
  name: string;
  remarks: string;
}

interface SiteTransferAssetLinesProps {
  sendingProjectId: number;
  sendingStorageLocationId: number;
  rows: SiteTransferAssetRow[];
  onChange: (rows: SiteTransferAssetRow[]) => void;
}

/** How an asset reads in a list: its code first, since that is what is painted on it. */
export function assetLabel(asset: {
  assetCode: string | null;
  name: string;
}): string {
  return asset.assetCode ? `${asset.assetCode} · ${asset.name}` : asset.name;
}

/**
 * The asset half of the transfer form: pick assets that are at the sending
 * store and not already on their way somewhere.
 *
 * The list comes from the server (`useSendableAssets`), which applies the same
 * rule the transfer is checked against, so an asset offered here is one the
 * transfer will accept. Each asset is one line and one unit; there is no
 * quantity to type.
 *
 * @param props.sendingProjectId - The chosen sending project, `0` for none yet.
 * @param props.sendingStorageLocationId - The chosen sending store, `0` for none yet.
 * @param props.rows - Assets already chosen.
 * @param props.onChange - Receives the new set of chosen assets.
 */
export function SiteTransferAssetLines({
  sendingProjectId,
  sendingStorageLocationId,
  rows,
  onChange,
}: SiteTransferAssetLinesProps) {
  const storeChosen = Boolean(sendingProjectId && sendingStorageLocationId);
  const {
    data: options,
    isLoading,
    isError,
  } = useSendableAssets(
    storeChosen ? sendingProjectId : undefined,
    storeChosen ? sendingStorageLocationId : null
  );

  const chosenIds = new Set(rows.map((row) => row.assetId));
  const available = (options ?? []).filter(
    (option) => !chosenIds.has(option.id)
  );

  function add(option: SiteTransferAssetOption) {
    onChange([
      ...rows,
      {
        assetId: option.id,
        assetCode: option.assetCode,
        name: option.name,
        remarks: '',
      },
    ]);
  }

  function remove(assetId: number) {
    onChange(rows.filter((row) => row.assetId !== assetId));
  }

  function setRemarks(assetId: number, remarks: string) {
    onChange(
      rows.map((row) => (row.assetId === assetId ? { ...row, remarks } : row))
    );
  }

  let picker: React.ReactNode;
  if (!storeChosen) {
    picker = (
      <p className="text-muted-foreground text-sm">
        Choose the sending project and storage location to see the assets there.
      </p>
    );
  } else if (isLoading) {
    picker = (
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading the assets at this store...
      </p>
    );
  } else if (isError) {
    picker = (
      <p className="text-sm text-red-500">
        Could not load the assets at this store. Try again in a moment.
      </p>
    );
  } else if (available.length === 0) {
    picker = (
      <p className="text-muted-foreground text-sm">
        {rows.length > 0
          ? 'Every asset at this store is already on this transfer.'
          : 'No assets at this store are free to send. An asset has to be recorded at this store, and not already in transit on another transfer.'}
      </p>
    );
  } else {
    picker = (
      <Select
        value=""
        onValueChange={(value) => {
          const option = available.find((o) => o.id === Number(value));
          if (option) add(option);
        }}
      >
        <SelectTrigger id="addAsset" className="w-full sm:w-96">
          <SelectValue placeholder="Add an asset" />
        </SelectTrigger>
        <SelectContent>
          {available.map((option) => (
            <SelectItem key={option.id} value={String(option.id)}>
              {assetLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cog className="h-5 w-5" />
          Assets to Transfer
        </CardTitle>
        <CardDescription>
          Machines and equipment going with this transfer, one asset per line.
          Between two projects an asset is in transit until the receiving site
          records it arriving; between two stores on one project it moves at
          once.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {picker}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Asset</TableHead>
                  <TableHead className="min-w-[160px]">Remarks</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.assetId}>
                    <TableCell className="font-medium">
                      {assetLabel(row)}
                    </TableCell>
                    <TableCell>
                      <Input
                        aria-label={`Remarks for ${row.name}`}
                        value={row.remarks}
                        onChange={(e) =>
                          setRemarks(row.assetId, e.target.value)
                        }
                        placeholder="Optional note"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500"
                        onClick={() => remove(row.assetId)}
                        aria-label={`Remove ${row.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
