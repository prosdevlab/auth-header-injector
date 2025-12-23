import { formatDistanceToNow } from 'date-fns';
import { Activity, Globe } from 'lucide-react';
import type { CurrentTab } from '../hooks/useCurrentTab';

interface ContextBarProps {
  tab: CurrentTab;
  matchCount: number; // Number of rules matching this page
  requestCount: number; // Total requests intercepted for these rules
  lastSeen: number | null; // Most recent request timestamp
  isEnabled: boolean; // Whether extension is enabled
  loading?: boolean;
}

/**
 * Compact context bar showing current page and actionable status
 * Uses existing metadata to show if rules are working
 */
export function ContextBar({
  tab,
  matchCount,
  requestCount,
  lastSeen,
  isEnabled,
  loading,
}: ContextBarProps) {
  // Extract org name from hostname (e.g., "lytics" from "app.lytics.com")
  const getOrgName = (url: string | null) => {
    if (!url) return null;
    try {
      const hostname = new URL(url).hostname;
      const parts = hostname.split('.');
      // Get second-to-last part (e.g., "lytics" from "app.lytics.com")
      return parts.length >= 2 ? parts[parts.length - 2] : hostname;
    } catch {
      return url;
    }
  };

  const orgName = getOrgName(tab.url);

  return (
    <div className="sticky top-[60px] z-10 border-b border-border bg-muted/30 backdrop-blur-sm p-3">
      <div className="px-4 py-3 space-y-2">
        {/* Page/Org Name */}
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          {loading ? (
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : tab.isRestricted ? (
            <span className="text-sm text-destructive">Not available on this page</span>
          ) : (
            <span className="text-sm font-medium text-foreground truncate">
              {orgName || 'No page'}
            </span>
          )}
        </div>

        {/* Activity Status */}
        {!loading && !tab.isRestricted && isEnabled && matchCount > 0 && (
          <div className="flex items-center gap-2 pl-6">
            {requestCount > 0 ? (
              <>
                <Activity className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">
                  {requestCount} request{requestCount === 1 ? '' : 's'}
                  {lastSeen && (
                    <span className="text-muted-foreground ml-1">
                      • {formatDistanceToNow(lastSeen, { addSuffix: true })}
                    </span>
                  )}
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">No matching requests yet</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
