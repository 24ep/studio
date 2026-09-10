import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-14 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-[12px] leading-5 text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 max-sm:text-base',
          className
        )}
        ref={ref}
        {...props}
        {...(props.value !== undefined ? { value: props.value } : {})}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
