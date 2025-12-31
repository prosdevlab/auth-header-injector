import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { AuthRule, AuthScheme } from '@/shared/types';
import { useState } from 'react';

interface RuleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rule: Omit<AuthRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: AuthRule;
  title: string;
}

export function RuleForm({ open, onOpenChange, onSubmit, initialData, title }: RuleFormProps) {
  const [pattern, setPattern] = useState(initialData?.pattern || '');
  const [token, setToken] = useState(initialData?.token || '');
  const [label, setLabel] = useState(initialData?.label || '');
  const [scheme, setScheme] = useState<AuthScheme>(initialData?.scheme || 'Bearer');
  const [enabled, setEnabled] = useState(initialData?.enabled ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ pattern?: string; token?: string }>({});

  const handleClose = () => {
    if (!isSubmitting) {
      setPattern(initialData?.pattern || '');
      setToken(initialData?.token || '');
      setLabel(initialData?.label || '');
      setScheme(initialData?.scheme || 'Bearer');
      setEnabled(initialData?.enabled ?? true);
      setErrors({});
      onOpenChange(false);
    }
  };

  const validate = () => {
    const newErrors: { pattern?: string; token?: string } = {};

    if (!pattern.trim()) {
      newErrors.pattern = 'URL pattern is required';
    } else if (pattern.includes(' ')) {
      newErrors.pattern = 'URL pattern cannot contain spaces';
    }

    if (!token.trim()) {
      newErrors.token = 'Authorization token is required';
    } else if (token.length < 10) {
      newErrors.token = 'Token must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const ruleData: Omit<AuthRule, 'id' | 'createdAt' | 'updatedAt'> = {
        pattern: pattern.trim(),
        token: token.trim(),
        scheme: scheme || 'Bearer', // Default to Bearer if not set
        enabled,
      };

      // Only add label if it's non-empty
      if (label.trim()) {
        ruleData.label = label.trim();
      }

      await onSubmit(ruleData);
      handleClose();
    } catch (error) {
      console.error('Failed to submit rule:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Configure a URL pattern and authorization token for header injection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Label Input */}
            <div className="space-y-2">
              <Label htmlFor="label">Label (Optional)</Label>
              <Input
                id="label"
                placeholder="e.g., Staging API, GitHub Dev, Production"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                A friendly name to help you identify this rule
              </p>
            </div>

            {/* Pattern Input */}
            <div className="space-y-2">
              <Label htmlFor="pattern">URL Pattern *</Label>
              <Input
                id="pattern"
                placeholder="*.api.example.com or api.staging.com"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Use * for wildcards (e.g., *.api.com matches all subdomains)
              </p>
              {errors.pattern && <p className="text-xs text-destructive">{errors.pattern}</p>}
            </div>

            {/* Scheme Selector */}
            <div className="space-y-2">
              <Label htmlFor="scheme">Auth Scheme *</Label>
              <Select
                value={scheme}
                onValueChange={(value) => setScheme(value as AuthScheme)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="scheme">
                  <SelectValue placeholder="Select auth scheme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bearer">Bearer</SelectItem>
                  <SelectItem value="Raw">Raw Token</SelectItem>
                  <SelectItem value="Basic">Basic</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {scheme === 'Bearer' && 'Will be sent as: Authorization: Bearer {token}'}
                {scheme === 'Raw' && 'Will be sent as: Authorization: {token}'}
                {scheme === 'Basic' &&
                  'Will be sent as: Authorization: Basic {token} (token should be base64-encoded)'}
              </p>
            </div>

            {/* Token Input */}
            <div className="space-y-2">
              <Label htmlFor="token">Authorization Token *</Label>
              <Input
                id="token"
                type="password"
                placeholder="Enter your auth token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.token && <p className="text-xs text-destructive">{errors.token}</p>}
            </div>

            {/* Enabled Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
                disabled={isSubmitting}
              />
              <Label htmlFor="enabled" className="cursor-pointer">
                Enable this rule
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
