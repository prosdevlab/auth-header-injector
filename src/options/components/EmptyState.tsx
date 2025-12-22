import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface EmptyStateProps {
  onAddRule: () => void;
}

export function EmptyState({ onAddRule }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-3 mb-4">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No auth rules yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Get started by adding your first auth rule to automatically inject authorization headers
        into matching requests.
      </p>
      <Button onClick={onAddRule}>Add First Rule</Button>
    </div>
  );
}
