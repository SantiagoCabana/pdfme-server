import * as React from 'react';

import { cn } from '@/lib/utils';

function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--primary)] text-sm font-bold text-[var(--primary-foreground)]', className)}
      {...props}
    />
  );
}

export { Avatar };
