import { Globe } from 'lucide-react';

interface PageInfoProps {
  orgName: string | null;
  isLoading: boolean;
  isRestricted: boolean;
}

/**
 * Displays the current page's organization name with a Globe icon
 * Handles loading and restricted states
 */
export function PageInfo({ orgName, isLoading, isRestricted }: PageInfoProps) {
  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-primary flex-shrink-0" />
      {isLoading ? (
        <span className="text-sm text-muted-foreground">Loading...</span>
      ) : isRestricted ? (
        <span className="text-sm text-destructive">Not available on this page</span>
      ) : (
        <span className="text-sm font-medium text-foreground truncate text-primary">
          {orgName || 'No page'}
        </span>
      )}
    </div>
  );
}
