import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircleIcon } from 'lucide-react';

interface MultipleRulesWarningProps {
  activeRulesCount: number;
}

/**
 * Compact warning displayed when multiple rules are active on the current page
 * Shown in the ContextBar to inform users about rule precedence
 */
export function MultipleRulesWarning({ activeRulesCount }: MultipleRulesWarningProps) {
  return (
    <Alert variant="default" className="my-1 pl-6">
      <AlertCircleIcon className="h-3.5 w-3.5" />
      <AlertTitle className="text-sm font-medium">
        {activeRulesCount} rules are active on this page
      </AlertTitle>
      <AlertDescription className="text-xs mt-0.5">
        When multiple rules match a page, the most specific pattern wins.
      </AlertDescription>
    </Alert>
  );
}
