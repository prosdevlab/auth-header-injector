import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useRequestStats } from '../hooks/useRequestStats';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { stats, clearStats } = useRequestStats();
  const [isClearing, setIsClearing] = useState(false);

  // Calculate total requests across all domains
  const totalRequests = Object.values(stats).reduce((sum, stat) => sum + stat.count, 0);
  const domainCount = Object.keys(stats).length;

  const handleClearHistory = async () => {
    if (
      !confirm(
        `Are you sure you want to clear request history?\n\nThis will delete ${totalRequests} tracked request${totalRequests === 1 ? '' : 's'} across ${domainCount} domain${domainCount === 1 ? '' : 's'}.`,
      )
    ) {
      return;
    }

    setIsClearing(true);
    try {
      await clearStats();
    } catch (error) {
      console.error('Failed to clear history:', error);
      alert('Failed to clear history. Check console for details.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your extension settings and request history</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Request Statistics */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Request History</h3>
            <p className="text-sm text-muted-foreground">
              {totalRequests > 0 ? (
                <>
                  Tracking <span className="font-medium text-foreground">{totalRequests}</span>{' '}
                  request{totalRequests === 1 ? '' : 's'} across{' '}
                  <span className="font-medium text-foreground">{domainCount}</span> domain
                  {domainCount === 1 ? '' : 's'}
                </>
              ) : (
                'No requests tracked yet'
              )}
            </p>
          </div>

          {/* Tracked Domains Details */}
          {totalRequests > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                Tracked Data (Privacy-Safe)
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2 rounded-md border border-border bg-muted/30 p-3">
                {Object.entries(stats)
                  .sort((a, b) => b[1].lastSeen - a[1].lastSeen)
                  .map(([domain, stat]) => (
                    <div key={domain} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-foreground">{domain}</span>
                        <span className="text-muted-foreground">{stat.count} requests</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Last seen: {new Date(stat.lastSeen).toLocaleString()}</span>
                        <span>
                          {stat.ruleIds.length} rule{stat.ruleIds.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
              <p className="text-xs text-muted-foreground italic">
                ℹ️ We only store: domain, request count, timestamp, and rule IDs. No tokens, headers,
                or URLs.
              </p>
            </div>
          )}

          {/* Clear History Button */}
          {totalRequests > 0 && (
            <div className="pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearHistory}
                disabled={isClearing}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isClearing ? 'Clearing...' : 'Clear Request History'}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This only clears tracking data. Your rules will remain unchanged.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
