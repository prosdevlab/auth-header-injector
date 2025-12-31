import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Activity, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { DomainStats } from '../hooks/useRequestStats';

interface ActivityStatusProps {
  requestCount: number;
  lastSeen: number | null;
  domains?: Array<{ domain: string; stat: DomainStats }>;
}

/**
 * Displays activity status showing request count and last seen timestamp
 * Expandable to show domain-level breakdown
 * Shown in the ContextBar when rules are active on the current page
 */
export function ActivityStatus({ requestCount, lastSeen, domains }: ActivityStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDomains = domains && domains.length > 0;

  if (requestCount === 0) {
    return (
      <div className="flex items-center gap-2 pl-6">
        <span className="text-xs text-muted-foreground">No matching requests yet</span>
      </div>
    );
  }

  return (
    <div>
      {/* Collapsed Summary (clickable if domains available) */}
      {hasDomains ? (
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-auto p-0 hover:bg-transparent justify-start w-full"
        >
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">
              {requestCount} request{requestCount === 1 ? '' : 's'}
              {lastSeen && (
                <span className="text-muted-foreground ml-1">
                  • {formatDistanceToNow(lastSeen, { addSuffix: true })}
                </span>
              )}
            </span>
            <ChevronDown
              className={`h-3 w-3 text-muted-foreground transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">
            {requestCount} request{requestCount === 1 ? '' : 's'}
            {lastSeen && (
              <span className="text-muted-foreground ml-1">
                • {formatDistanceToNow(lastSeen, { addSuffix: true })}
              </span>
            )}
          </span>
        </div>
      )}

      {/* Expanded Domain Breakdown */}
      {isExpanded && hasDomains && (
        <div className="mt-2 space-y-1 pl-5">
          {domains.map(({ domain, stat }) => (
            <div key={domain} className="px-2 py-1.5 rounded bg-muted/50 border border-border/50">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium truncate">{domain}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {stat.count} request{stat.count === 1 ? '' : 's'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(stat.lastSeen, { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
