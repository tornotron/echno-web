'use client';

import { useState } from 'react';
import { Input } from '@/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';

/** One suggested sub-category. */
export interface SubcategoryOption {
  name: string;
  description?: string;
}

const NONE = '__none__';
const OTHER = '__other__';

interface SubcategoryFieldProps {
  id: string;
  /** The sub-category as text; an empty string is none. */
  value: string;
  onChange: (value: string) => void;
  /** The suggestions for the chosen category. */
  options: SubcategoryOption[];
  /** True while the suggestions are loading, so a saved value is not mistaken for free text. */
  loading?: boolean;
  /** Disables the field, for example until a category is chosen. */
  disabled?: boolean;
  placeholder?: string;
}

/**
 * A sub-category picker: a dropdown of the chosen category's sub-categories
 * with a last entry, "Other (type your own)", that opens a text box. The value
 * is plain text either way, so a saved sub-category that is not in the list
 * (typed by hand, or from a list that has since changed) opens in the text box.
 */
export function SubcategoryField({
  id,
  value,
  onChange,
  options,
  loading = false,
  disabled = false,
  placeholder = 'Select sub-category (optional)',
}: SubcategoryFieldProps) {
  const [otherChosen, setOtherChosen] = useState(false);
  const inList = options.some((option) => option.name === value);
  const isOther = otherChosen || (!loading && value !== '' && !inList);
  const selected = isOther ? OTHER : value === '' ? NONE : value;
  const description = inList
    ? options.find((option) => option.name === value)?.description
    : undefined;

  return (
    <div className="space-y-2">
      <Select
        value={loading && !isOther && value !== '' ? undefined : selected}
        disabled={disabled || loading}
        onValueChange={(next) => {
          if (next === OTHER) {
            setOtherChosen(true);
            if (inList) onChange('');
            return;
          }
          setOtherChosen(false);
          onChange(next === NONE ? '' : next);
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue
            placeholder={loading ? 'Loading sub-categories...' : placeholder}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>No sub-category</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.name} value={option.name}>
              {option.name}
            </SelectItem>
          ))}
          <SelectItem value={OTHER}>Other (type your own)</SelectItem>
        </SelectContent>
      </Select>
      {isOther && (
        <Input
          id={`${id}-other`}
          aria-label="Sub-category, typed in"
          value={value}
          maxLength={255}
          disabled={disabled}
          placeholder="Type the sub-category"
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {description && (
        <p className="text-muted-foreground text-xs">{description}</p>
      )}
    </div>
  );
}
