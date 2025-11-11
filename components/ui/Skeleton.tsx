'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export default function Skeleton({
  variant = 'rectangular',
  width,
  height,
  className,
  ...props
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  const variantClasses = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
      {...props}
      aria-busy="true"
      aria-live="polite"
    />
  );
}

// Pre-built skeleton components
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('card p-6 space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonTutorCard() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="50%" />
          <Skeleton variant="text" width="30%" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" width={80} height={24} />
        <Skeleton variant="rectangular" width={80} height={24} />
        <Skeleton variant="rectangular" width={80} height={24} />
      </div>
      <Skeleton variant="rectangular" width="100%" height={40} />
    </div>
  );
}

