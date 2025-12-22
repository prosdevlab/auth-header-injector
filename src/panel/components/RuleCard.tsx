import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import type { AuthRule } from '@/shared/types';
import { Copy, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface RuleCardProps {
  rule: AuthRule;
  isMatched: boolean;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopyToken: () => void;
}

/**
 * Rule card with progressive disclosure
 * - Collapsed by default (label + pattern)
 * - Click to expand (shows token + actions)
 * - Visual styling based on matched status
 */
export function RuleCard({
  rule,
  isMatched,
  onToggle,
  onEdit,
  onDelete,
  onCopyToken,
}: RuleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card
      className={`transition-colors ${
        isMatched ? 'border-primary/20 bg-primary/5' : 'border-muted bg-muted/30'
      }`}
    >
      <div className="p-3">
        {/* Collapsed View (always visible) */}
        <Button
          type="button"
          variant="ghost"
          className="flex items-start justify-between gap-2 w-full text-left h-auto p-0 hover:bg-transparent"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex-1 min-w-0">
            {/* Label (if exists) */}
            {rule.label && (
              <p
                className={`text-sm font-semibold truncate ${isMatched ? 'text-primary' : 'text-foreground'}`}
              >
                {rule.label}
              </p>
            )}
            {/* Pattern */}
            <p className="text-xs font-mono text-muted-foreground truncate">{rule.pattern}</p>
          </div>

          {/* Status & Menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Switch
              checked={rule.enabled}
              onCheckedChange={onToggle}
              onClick={(e) => e.stopPropagation()}
              className="scale-90"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </Button>

        {/* Expanded View (on demand) */}
        {isExpanded && (
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            {/* Token Preview */}
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground flex-1 truncate font-mono">
                Bearer {rule.token.slice(0, 8)}...{rule.token.slice(-4)}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyToken();
                }}
                title="Copy token"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="flex-1"
              >
                <Pencil className="mr-1 h-3 w-3" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="flex-1"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
