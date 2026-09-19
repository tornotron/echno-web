'use client';

import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { useCreateToolboxTalks } from '@tornotron/echno-core/toolbox-talks/hooks';
import { getErrorMessage } from '@tornotron/echno-core';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';

interface ToolboxTalksFormProps {
  /** Called after a successful create, or when the user cancels. */
  onDone: () => void;
}

/**
 * Records one Toolbox Talks entry through `useCreateToolboxTalks`.
 * Replace the fields with the module's real request shape.
 */
export function ToolboxTalksForm({ onDone }: ToolboxTalksFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const create = useCreateToolboxTalks();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    create.mutate(
      { name: trimmed, description: description.trim() || undefined },
      { onSuccess: onDone }
    );
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-md border p-4"
      data-testid="toolbox-talks-form"
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="toolbox-talks-name">Name</Label>
        <Input
          id="toolbox-talks-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="toolbox-talks-description">Description</Label>
        <Textarea
          id="toolbox-talks-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      {create.isError && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(create.error)}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={create.isPending || !name.trim()}>
          {create.isPending && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
      </div>
    </form>
  );
}
