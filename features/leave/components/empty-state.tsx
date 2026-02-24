import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Icon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
        <h3 className="text-foreground mb-2 text-lg font-medium">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        {action && <Button onClick={action.onClick}>{action.label}</Button>}
      </CardContent>
    </Card>
  );
}
