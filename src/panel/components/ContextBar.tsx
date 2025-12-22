import { Globe } from 'lucide-react';
import type { CurrentTab } from '../hooks/useCurrentTab';

interface ContextBarProps {
  tab: CurrentTab;
  matchCount: number; // Number of rules actively intercepting requests (based on stats)
  requestCount: number; // Total requests intercepted
  loading?: boolean;
}

/**
 * Context bar showing current page and active interceptors
 * "Active" means the rule has actually intercepted API calls (not URL pattern matching)
 */
export function ContextBar({ tab, matchCount, requestCount, loading }: ContextBarProps) {
  // Extract hostname from URL
  const getHostname = (url: string | null) => {
    if (!url) return null;
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const hostname = getHostname(tab.url);

  return (
    <div className="sticky top-[60px] z-10 border-b border-border bg-muted/30 backdrop-blur-sm p-3">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          {loading ? (
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : tab.isRestricted ? (
            <span className="text-sm text-destructive">Not available on this page</span>
          ) : (
            <span className="text-sm font-medium text-foreground truncate">
              {hostname || 'No page'}
            </span>
          )}
        </div>

        {!loading && !tab.isRestricted && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`h-2 w-2 rounded-full ${matchCount > 0 ? 'bg-primary' : 'bg-muted-foreground'}`}
            />
            <span
              className={`text-xs font-medium ${matchCount > 0 ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {requestCount > 0
                ? `${requestCount} request${requestCount === 1 ? '' : 's'} • ${matchCount} rule${matchCount === 1 ? '' : 's'}`
                : matchCount > 0
                  ? `${matchCount} rule${matchCount === 1 ? '' : 's'} active`
                  : 'No active rules'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
