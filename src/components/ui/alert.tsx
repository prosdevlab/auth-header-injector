import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/shared/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'bg-destructive/10 border-destructive/50 text-destructive dark:border-destructive dark:bg-destructive/20 [&>svg]:text-destructive',
        warning:
          'bg-warning/10 border-warning/50 text-warning dark:border-warning dark:bg-warning/20 [&>svg]:text-warning',
        info: 'bg-primary/10 border-primary/50 text-primary dark:border-primary dark:bg-primary/20 [&>svg]:text-primary',
        success:
          'bg-success/10 border-success/50 text-success dark:border-success dark:bg-success/20 [&>svg]:text-success',
        error:
          'bg-error/10 border-error/50 text-error dark:border-error dark:bg-error/20 [&>svg]:text-error',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  ),
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
