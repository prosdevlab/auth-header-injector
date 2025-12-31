import type { CurrentTab } from '../hooks/useCurrentTab';
import type { DomainStats } from '../hooks/useRequestStats';
import { ActivityStatus } from './ActivityStatus';
import { MultipleRulesWarning } from './MultipleRulesWarning';
import { PageInfo } from './PageInfo';

interface ContextBarProps {
  tab: CurrentTab;
  matchCount: number; // Number of rules matching this page
  requestCount: number; // Total requests intercepted for these rules
  lastSeen: number | null; // Most recent request timestamp
  isEnabled: boolean; // Whether extension is enabled
  activeRulesCount?: number; // Number of rules that have intercepted requests for current page
  domains?: Array<{ domain: string; stat: DomainStats }>; // Domain-level stats for breakdown
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
  activeRulesCount = 0,
  domains,
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
  const hasMultipleActiveRules = activeRulesCount >= 2;

  return (
    <div className="sticky top-[60px] z-10 border-b border-border bg-muted/30 backdrop-blur-sm p-3">
      <div className="px-4 py-3 space-y-2">
        {/* Multiple Rules Warning */}
        {activeRulesCount > 0 &&
          !loading &&
          !tab.isRestricted &&
          isEnabled &&
          hasMultipleActiveRules && <MultipleRulesWarning activeRulesCount={activeRulesCount} />}
        {/* Page/Org Name */}
        <PageInfo
          orgName={orgName ?? null}
          isLoading={loading ?? false}
          isRestricted={tab.isRestricted}
        />

        {/* Activity Status */}
        {!loading && !tab.isRestricted && isEnabled && matchCount > 0 && (
          <ActivityStatus
            requestCount={requestCount}
            lastSeen={lastSeen}
            {...(domains !== undefined && { domains })}
          />
        )}
      </div>
    </div>
  );
}
