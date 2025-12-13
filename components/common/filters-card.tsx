import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface FiltersCardProps {
  title: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  children: React.ReactNode;
}

export function FiltersCard({
  title,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  children,
}: FiltersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
