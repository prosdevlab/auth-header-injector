import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { AuthRule } from '@/shared/types';
import { useState } from 'react';
import { ContextBar } from './components/ContextBar';
import { RuleForm } from './components/RuleForm';
import { RulesList } from './components/RulesList';
import { useAuthRules } from './hooks/useAuthRules';
import { useCurrentTab } from './hooks/useCurrentTab';
import { useExtensionEnabled } from './hooks/useExtensionEnabled';
import { useRequestStats } from './hooks/useRequestStats';

export function App() {
  const { rules, loading: rulesLoading, addRule, updateRule, deleteRule } = useAuthRules();
  const { isEnabled, loading: enabledLoading, setEnabled } = useExtensionEnabled();
  const { tab, loading: tabLoading } = useCurrentTab();
  const {
    getActiveRuleIds,
    getCountForRules,
    getLastSeenForRules,
    getCountForRule,
    getDomainsForRules,
    loading: statsLoading,
  } = useRequestStats();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AuthRule | null>(null);

  const loading = rulesLoading || enabledLoading || tabLoading || statsLoading;

  // Extract hostname from URL
  const getHostname = (url: string | null) => {
    if (!url) return null;
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const currentHostname = getHostname(tab.url);

  // Extract organization name from hostname (e.g., "lytics" from "app.lytics.com")
  const getOrgName = (hostname: string | null): string | null => {
    if (!hostname) return null;
    const parts = hostname.split('.');
    if (parts.length === 1) return hostname; // localhost, etc.
    return parts[parts.length - 2] || null; // e.g., "lytics" from "app.lytics.com"
  };

  const currentOrg = getOrgName(currentHostname);

  // Filter rules relevant to the current page's organization
  // E.g., on "app.lytics.com", show stats for rules like "*.lytics.io"
  const relevantRules = rules.filter((rule) => {
    if (!currentOrg) return false;

    // Extract org from rule pattern (e.g., "lytics" from "*.lytics.io")
    const patternMatch = rule.pattern.match(/([^.]+)\.[^.]+$/);
    const patternOrg = patternMatch?.[1] || null;
    return patternOrg === currentOrg;
  });

  // Active = rules relevant to current page AND have intercepted requests AND are enabled
  // Only enabled rules can intercept requests, so we filter out disabled ones
  const activeRuleIds = getActiveRuleIds();
  const activeDisplayRules = relevantRules.filter(
    (rule) => rule.enabled && activeRuleIds.has(rule.id),
  );

  // Get request count and timestamp for relevant rules
  const relevantPatterns = relevantRules.map((r) => r.pattern);
  const pageRequestCount = getCountForRules(relevantPatterns);
  const lastSeenTimestamp = getLastSeenForRules(relevantPatterns);
  const domainStats = getDomainsForRules(relevantPatterns);

  // Handlers
  const handleAddRule = async (rule: Omit<AuthRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addRule(rule);
    setIsFormOpen(false);
  };

  const handleEditRule = async (rule: Omit<AuthRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingRule) {
      await updateRule(editingRule.id, rule);
      setEditingRule(null);
    }
  };

  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      // TODO: Show toast notification (Phase 2)
    } catch (error) {
      console.error('Failed to copy token:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header (Sticky) */}
      <div className="sticky top-0 z-20 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="extension-enabled" className="cursor-pointer text-sm font-medium">
              Enable extension
            </Label>
            <Switch
              id="extension-enabled"
              checked={isEnabled}
              onCheckedChange={setEnabled}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Context Bar (Sticky) - Shows active rules for current page */}
      <ContextBar
        tab={tab}
        matchCount={relevantRules.length}
        requestCount={pageRequestCount}
        lastSeen={lastSeenTimestamp}
        isEnabled={isEnabled}
        activeRulesCount={activeDisplayRules.length}
        domains={domainStats}
        loading={loading}
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <>
            <RulesList
              rules={rules}
              matchedRules={activeDisplayRules}
              isEnabled={isEnabled}
              isRestricted={tab.isRestricted}
              currentHostname={currentHostname}
              getCountForRule={getCountForRule}
              onAddRule={() => setIsFormOpen(true)}
              onEditRule={(rule) => setEditingRule(rule)}
              onDeleteRule={deleteRule}
              onToggleRule={(id, enabled) => updateRule(id, { enabled })}
              onCopyToken={handleCopyToken}
            />
          </>
        )}
      </div>

      {/* Add Rule Dialog */}
      <RuleForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddRule}
        title="Add Auth Rule"
      />

      {/* Edit Rule Dialog */}
      {editingRule && (
        <RuleForm
          open={!!editingRule}
          onOpenChange={(open) => !open && setEditingRule(null)}
          onSubmit={handleEditRule}
          initialData={editingRule}
          title="Edit Auth Rule"
        />
      )}
    </div>
  );
}
