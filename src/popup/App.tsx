import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuthRules } from '@/options/hooks/useAuthRules';
import { useExtensionEnabled } from '@/options/hooks/useExtensionEnabled';
import { AlertCircle, Copy, ExternalLink, Globe, Shield, ShieldOff } from 'lucide-react';
import { useCurrentTab } from './hooks/useCurrentTab';
import { useMatchedRules } from './hooks/useMatchedRules';

export function App() {
  const { rules, loading: rulesLoading, updateRule } = useAuthRules();
  const { isEnabled, loading: enabledLoading, setEnabled } = useExtensionEnabled();
  const { tab, loading: tabLoading } = useCurrentTab();
  const matchedRules = useMatchedRules(rules, tab.url);

  const loading = rulesLoading || enabledLoading || tabLoading;
  const activeRulesCount = rules.filter((r) => r.enabled).length;

  const handleToggleRule = async (id: string, enabled: boolean) => {
    await updateRule(id, { enabled });
  };

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      // Could add a toast notification here in the future
    } catch (error) {
      console.error('Failed to copy token:', error);
    }
  };

  const addRuleForCurrentDomain = () => {
    const hostname = getHostname(tab.url);
    if (hostname) {
      // Open options page with pre-filled domain
      // We'll pass the hostname via URL parameter
      chrome.runtime.openOptionsPage(() => {
        // In a future enhancement, we could pass the hostname to pre-fill the form
        // For now, just open the options page
      });
    }
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  // Extract hostname from URL for display
  const getHostname = (url: string | null) => {
    if (!url) return null;
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="p-2">
      <div className="w-[360px] overflow-hidden bg-gradient-to-br from-background via-background to-purple-50/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-4">
          {/* Master Toggle */}
          <div className="flex items-center justify-between bg-card p-3">
            <Switch
              id="extension-enabled"
              checked={isEnabled}
              onCheckedChange={setEnabled}
              disabled={loading}
            />
            <Label htmlFor="extension-enabled" className="cursor-pointer font-medium">
              Extension {isEnabled ? 'Active' : 'Inactive'}
            </Label>
          </div>
        </div>

        {/* Current Page Context */}
        <div className="border-b border-purple-100 bg-muted/30 p-4">
          <div className="flex items-start gap-2">
            <Globe className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-foreground">Current Page</p>
              {loading ? (
                <p className="text-xs text-muted-foreground">Loading...</p>
              ) : tab.isRestricted ? (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>Not available on this page</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{getHostname(tab.url)}</p>
              )}
            </div>
          </div>

          {/* Match Status */}
          {!loading && !tab.isRestricted && (
            <div className="mt-2 flex items-center gap-2 rounded-md bg-card px-3 py-2">
              {matchedRules.length > 0 ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-green-700">
                    {matchedRules.length} {matchedRules.length === 1 ? 'rule' : 'rules'} active
                  </span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-gray-400" />
                  <span className="text-xs text-muted-foreground">No rules match this page</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Matched Rules */}
        <div className="max-h-[300px] overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : !isEnabled ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <ShieldOff className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Extension Disabled</p>
              <p className="text-xs text-muted-foreground">Enable to inject auth headers</p>
            </div>
          ) : tab.isRestricted ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <p className="text-sm font-medium">Not Available</p>
              <p className="text-xs text-muted-foreground">
                Extension cannot run on browser internal pages
              </p>
            </div>
          ) : matchedRules.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="rounded-full bg-muted p-3">
                <Shield className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">No Rules Match</p>
                <p className="text-xs text-muted-foreground">
                  Add a rule to inject headers on this page
                </p>
              </div>
              {!tab.isRestricted && getHostname(tab.url) && (
                <Button onClick={addRuleForCurrentDomain} size="sm" className="mt-2">
                  Add Rule for {getHostname(tab.url)}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Active Rules</p>
              {matchedRules.map((rule) => (
                <Card key={rule.id} className="border-purple-200 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        {rule.label && (
                          <p className="text-sm font-medium text-foreground">{rule.label}</p>
                        )}
                        <p className="text-xs font-mono text-muted-foreground">{rule.pattern}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            Bearer {rule.token.slice(0, 6)}...{rule.token.slice(-3)}
                          </p>
                          <button
                            type="button"
                            onClick={() => copyToken(rule.token)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="Copy token"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => handleToggleRule(rule.id, enabled)}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-purple-100 bg-muted/20 p-4">
          <Button onClick={openOptions} className="w-full shadow-sm" size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            Manage All Rules ({activeRulesCount} active)
          </Button>
        </div>
      </div>
    </div>
  );
}
