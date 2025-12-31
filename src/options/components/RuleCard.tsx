import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { AuthRule } from '@/shared/types';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface RuleCardProps {
  rule: AuthRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
}

export function RuleCard({ rule, onEdit, onDelete, onToggle }: RuleCardProps) {
  const [showToken, setShowToken] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  const maskedToken = '•'.repeat(Math.min(rule.token.length, 20));

  return (
    <>
      <Card className="p-4">
        <div className="space-y-3">
          {/* Label (if exists) */}
          {rule.label && (
            <div>
              <div className="text-lg font-semibold text-foreground">{rule.label}</div>
            </div>
          )}

          {/* Pattern */}
          <div>
            <div className="text-sm font-medium text-muted-foreground">URL Pattern</div>
            <div className="mt-1 font-mono text-sm">{rule.pattern}</div>
          </div>

          {/* Scheme & Token */}
          <div>
            <div className="text-sm font-medium text-muted-foreground">Auth Scheme & Token</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {rule.scheme || 'Bearer'}
              </span>
              <code className="text-sm">{showToken ? rule.token : maskedToken}</code>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center space-x-2">
              <Switch id={`rule-${rule.id}`} checked={rule.enabled} onCheckedChange={onToggle} />
              <Label htmlFor={`rule-${rule.id}`} className="cursor-pointer text-sm">
                {rule.enabled ? 'Enabled' : 'Disabled'}
              </Label>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Auth Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this rule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              {rule.label && (
                <div className="text-sm">
                  <span className="font-medium">Label:</span> {rule.label}
                </div>
              )}
              <div className="text-sm">
                <span className="font-medium">Pattern:</span> {rule.pattern}
              </div>
              <div className="text-sm">
                <span className="font-medium">Token:</span> {maskedToken}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
