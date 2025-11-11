'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  id: string;
  showOnce?: boolean;
  delay?: number;
}

export default function Tooltip({ 
  content, 
  position = 'top', 
  children, 
  id,
  showOnce = true,
  delay = 1000,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if tooltip has been shown before
    if (showOnce) {
      const tooltipShown = localStorage.getItem(`ezstudy_tooltip_${id}`);
      if (tooltipShown === 'true') {
        setHasShown(true);
        return;
      }
    }

    // Show tooltip after delay
    timeoutRef.current = setTimeout(() => {
      if (!hasShown) {
        setIsVisible(true);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [id, delay, showOnce, hasShown]);

  const handleClose = () => {
    setIsVisible(false);
    if (showOnce) {
      localStorage.setItem(`ezstudy_tooltip_${id}`, 'true');
      setHasShown(true);
    }
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-white border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-white border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-white border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-white border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div className="relative inline-block" ref={triggerRef}>
      {children}
      <AnimatePresence>
        {isVisible && !hasShown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'absolute z-[1900] w-64 bg-white rounded-xl shadow-2xl border border-gray-200 p-4',
              positionClasses[position]
            )}
          >
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
              </div>
              <button
                onClick={handleClose}
                className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors min-w-[32px] min-h-[32px]"
                aria-label="Close tooltip"
              >
                <XMarkIcon className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            {/* Arrow */}
            <div
              className={cn(
                'absolute w-0 h-0 border-8',
                arrowClasses[position]
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

