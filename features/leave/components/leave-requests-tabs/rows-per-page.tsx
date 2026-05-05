import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';

interface RowsPerPageProps {
  value: number;
  onChange: (v: number) => void;
}

export function RowsPerPage({ value, onChange }: RowsPerPageProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">Rows per page:</span>
      <Select
        value={value.toString()}
        onValueChange={(v) => onChange(Number(v))}
      >
        <SelectTrigger className="w-[70px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[5, 10, 20, 50].map((n) => (
            <SelectItem key={n} value={n.toString()}>
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
