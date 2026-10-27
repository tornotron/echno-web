import { Badge } from '@/components/shadcn/badge';

/** Up to `max` chips, then a "+n" chip naming the rest on hover. */
export function ChipList({
  names,
  max = 2,
  emptyLabel = '—',
}: {
  names: string[];
  max?: number;
  emptyLabel?: string;
}) {
  if (names.length === 0)
    return <span className="text-xs text-zinc-400">{emptyLabel}</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {names.slice(0, max).map((n) => (
        <Badge key={n} variant="secondary" className="font-normal">
          {n}
        </Badge>
      ))}
      {names.length > max && (
        <Badge
          variant="outline"
          className="font-normal"
          title={names.slice(max).join(', ')}
        >
          +{names.length - max}
        </Badge>
      )}
    </span>
  );
}
