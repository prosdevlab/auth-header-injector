import { Button } from '@/components/ui/button';
import type { AuthRule } from '@/shared/types';
import { ChevronDown, ChevronRight, Play, Plus, Shield, ShieldOff } from 'lucide-react';
import { useState } from 'react';
import { RuleCard } from './RuleCard';

interface RulesListProps {
  rules: AuthRule[];
  matchedRules: AuthRule[];
  isEnabled: boolean;
  isRestricted: boolean;
  currentHostname: string | null;
  onAddRule: () => void;
  onEditRule: (rule: AuthRule) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string, enabled: boolean) => void;
  onCopyToken: (token: string) => void;
}

/**
 * Unified rules list with visual grouping
 * - Shows active rules at top (rules that have intercepted requests)
 * - Shows other rules below (dimmed)
 * - Context-specific empty states
 */
export function RulesList({
  rules,
  matchedRules,
  isEnabled,
  isRestricted,
  currentHostname,
  onAddRule,
  onEditRule,
  onDeleteRule,
  onToggleRule,
  onCopyToken,
}: RulesListProps) {
  const [isOtherRulesExpanded, setIsOtherRulesExpanded] = useState(false);

  const hasRules = rules.length > 0;
  const hasMatches = matchedRules.length > 0;
  const otherRules = rules.filter((rule) => !matchedRules.some((m) => m.id === rule.id));

  // Empty State: Extension Disabled
  if (!isEnabled) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 px-4 text-center">
        <div className="rounded-full bg-muted p-4">
          <ShieldOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Extension Disabled</p>
          <p className="text-xs text-muted-foreground mt-1">
            Enable the extension to inject auth headers
          </p>
        </div>
      </div>
    );
  }

  // Empty State: No Rules at All
  if (!hasRules) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 px-4 text-center">
        <div className="rounded-full bg-primary/10 p-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Welcome!</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add your first auth rule to start injecting headers
          </p>
        </div>
        {!isRestricted && currentHostname && (
          <Button onClick={onAddRule} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Rule for {currentHostname}
          </Button>
        )}
        {(isRestricted || !currentHostname) && (
          <Button onClick={onAddRule} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add New Rule
          </Button>
        )}
      </div>
    );
  }

  // Empty State: Has Rules, None Match
  if (!hasMatches && !isRestricted) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="rounded-full bg-muted p-3">
            <Shield className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No rules match {currentHostname}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add a rule to inject headers on this page
            </p>
          </div>
          {currentHostname && (
            <Button onClick={onAddRule} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Rule for {currentHostname}
            </Button>
          )}
        </div>

        {/* Show existing rules below */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Your Rules ({rules.length})
            </p>
          </div>
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              isMatched={false}
              onToggle={(enabled) => onToggleRule(rule.id, enabled)}
              onEdit={() => onEditRule(rule)}
              onDelete={() => onDeleteRule(rule.id)}
              onCopyToken={() => onCopyToken(rule.token)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Main View: Unified List with Grouping
  return (
    <div className="space-y-6 p-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Rules ({rules.length} total)</p>
        <Button onClick={onAddRule} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {/* Active Rules Section - Rules matching current page */}
      {hasMatches && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Play className="h-3.5 w-3.5 text-primary fill-primary" />
            <p className="text-xs font-semibold uppercase text-primary">
              For This Page ({matchedRules.length})
            </p>
          </div>
          {matchedRules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              isMatched={true}
              onToggle={(enabled) => onToggleRule(rule.id, enabled)}
              onEdit={() => onEditRule(rule)}
              onDelete={() => onDeleteRule(rule.id)}
              onCopyToken={() => onCopyToken(rule.token)}
            />
          ))}
        </div>
      )}

      {/* Other Rules Section - Collapsed by default */}
      {otherRules.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setIsOtherRulesExpanded(!isOtherRulesExpanded)}
            className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
          >
            {isOtherRulesExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Other Rules ({otherRules.length})
            </p>
          </button>
          {isOtherRulesExpanded &&
            otherRules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                isMatched={false}
                onToggle={(enabled) => onToggleRule(rule.id, enabled)}
                onEdit={() => onEditRule(rule)}
                onDelete={() => onDeleteRule(rule.id)}
                onCopyToken={() => onCopyToken(rule.token)}
              />
            ))}
        </div>
      )}
    </div>
  );
}
