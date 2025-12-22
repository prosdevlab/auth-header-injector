import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { AuthRule } from '@/shared/types';
import { useState } from 'react';
import { EmptyState } from './components/EmptyState';
import { RuleCard } from './components/RuleCard';
import { RuleForm } from './components/RuleForm';
import { useAuthRules } from './hooks/useAuthRules';
import { useExtensionEnabled } from './hooks/useExtensionEnabled';

export function App() {
  const { rules, loading: rulesLoading, addRule, updateRule, deleteRule } = useAuthRules();
  const { isEnabled, loading: enabledLoading, setEnabled } = useExtensionEnabled();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AuthRule | null>(null);

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

  const handleDeleteRule = async (id: string) => {
    await deleteRule(id);
  };

  const handleToggleRule = async (id: string, enabled: boolean) => {
    await updateRule(id, { enabled });
  };

  const loading = rulesLoading || enabledLoading;
  const activeRules = rules.filter((r) => r.enabled).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-50/30">
      <div className="mx-auto max-w-4xl space-y-6 p-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Auth Header Injector
          </h1>
          <p className="text-muted-foreground">
            Manage your authorization headers for API testing and development
          </p>
        </div>

        {/* Global Enable/Disable */}
        <Card className="border-purple-200 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle>Extension Status</CardTitle>
            <CardDescription>
              Master switch to enable or disable all auth header injection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="extension-enabled"
                checked={isEnabled}
                onCheckedChange={setEnabled}
                disabled={loading}
              />
              <Label htmlFor="extension-enabled" className="cursor-pointer font-medium">
                Extension {isEnabled ? 'Enabled' : 'Disabled'}
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Auth Rules Section */}
        <Card className="border-purple-200 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Auth Rules</CardTitle>
                <CardDescription>
                  {rules.length === 0
                    ? 'No rules configured yet'
                    : `${activeRules} of ${rules.length} rule${rules.length !== 1 ? 's' : ''} active`}
                </CardDescription>
              </div>
              <Button onClick={() => setIsFormOpen(true)} className="shadow-sm">
                Add New Rule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : rules.length === 0 ? (
              <EmptyState onAddRule={() => setIsFormOpen(true)} />
            ) : (
              <div className="space-y-4">
                {rules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    onEdit={() => setEditingRule(rule)}
                    onDelete={() => handleDeleteRule(rule.id)}
                    onToggle={(enabled) => handleToggleRule(rule.id, enabled)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
    </div>
  );
}
