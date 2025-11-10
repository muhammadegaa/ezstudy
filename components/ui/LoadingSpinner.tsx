'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva('animate-spin rounded-full border-solid border-t-transparent', {
  variants: {
    size: {
      sm: 'h-4 w-4 border-2',
      md: 'h-6 w-6 border-2',
      lg: 'h-8 w-8 border-3',
      xl: 'h-12 w-12 border-4',
    },
    spinnerColor: {
      primary: 'border-primary-600',
      white: 'border-white',
      gray: 'border-gray-600',
    },
  },
  defaultVariants: {
    size: 'md',
    spinnerColor: 'primary',
  },
});

export interface LoadingSpinnerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

export default function LoadingSpinner({
  className,
  size,
  spinnerColor,
  label = 'Loading...',
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-2', className)}
      role="status"
      aria-label={label}
      {...props}
    >
      <div className={cn(spinnerVariants({ size, spinnerColor }))} aria-hidden="true" />
      {label && <span className="text-sm text-gray-600 sr-only">{label}</span>}
    </div>
  );
}

