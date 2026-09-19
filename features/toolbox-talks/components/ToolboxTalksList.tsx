'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { useToolboxTalksList } from '@tornotron/echno-core/toolbox-talks/hooks';
import { getErrorMessage } from '@tornotron/echno-core';
import { Button } from '@/components/shadcn/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { ToolboxTalksForm } from './ToolboxTalksForm';

const PAGE_SIZE = 20;

/**
 * The Toolbox Talks list: one page of records from
 * `useToolboxTalksList`, with a form to add one. Replace the columns
 * with the module's real fields.
 */
export function ToolboxTalksList() {
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, isError, error } = useToolboxTalksList({
    page,
    size: PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-4" data-testid="toolbox-talks-list">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm((open) => !open)}>
          <Plus className="size-4" />
          New
        </Button>
      </div>

      {showForm && <ToolboxTalksForm onDone={() => setShowForm(false)} />}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading
        </div>
      )}

      {isError && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(error)}
        </p>
      )}

      {data && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground">
                    Nothing recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {data.content.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between text-sm">
            <span>
              Page {data.page + 1} of {Math.max(data.totalPages, 1)}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
