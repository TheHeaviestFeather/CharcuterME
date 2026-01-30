'use client';

import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { ReactNode } from 'react';

// =============================================================================
// Fallback UI Components
// =============================================================================

function DefaultFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF9F7] p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto bg-[#E8B4A0]/20 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-[#A47864]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-serif text-[#5D4E45]">
            Oops, something went wrong
          </h2>
          <p className="text-[#9A8A7C] text-sm">
            Even the best charcuterie boards have a cheese that rolls off sometimes.
          </p>
        </div>

        {/* Error details (development only) */}
        {process.env.NODE_ENV === 'development' && error instanceof Error && error.message && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left">
            <p className="text-xs font-mono text-red-600 break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={resetErrorBoundary}
            className="
              w-full py-3 px-6
              bg-[#E8734A] text-white rounded-full
              font-medium text-sm
              hover:bg-[#D4623A] transition-colors
              focus:outline-none focus:ring-2 focus:ring-[#E8734A] focus:ring-offset-2
            "
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="
              w-full py-3 px-6
              bg-transparent text-[#A47864] rounded-full
              font-medium text-sm border border-[#E8B4A0]
              hover:bg-[#FAF6F3] transition-colors
              focus:outline-none focus:ring-2 focus:ring-[#A47864] focus:ring-offset-2
            "
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}

function MinimalFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div className="p-4 text-center">
      <p className="text-[#9A8A7C] text-sm mb-3">Something went wrong</p>
      <button
        onClick={resetErrorBoundary}
        className="
          px-4 py-2 text-sm
          bg-[#E8734A] text-white rounded-full
          hover:bg-[#D4623A] transition-colors
        "
      >
        Try Again
      </button>
    </div>
  );
}

// =============================================================================
// Error Boundary Components
// =============================================================================

interface AppErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

/**
 * App-level error boundary with full-screen fallback
 */
export function AppErrorBoundary({ children, onReset }: AppErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={DefaultFallback}
      onReset={onReset}
      onError={(error, info) => {
        // Log to your error tracking service
        console.error('App Error:', error, info.componentStack);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

interface ComponentErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

/**
 * Component-level error boundary with minimal fallback
 */
export function ComponentErrorBoundary({
  children,
  fallback,
  onReset,
}: ComponentErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={fallback ? () => <>{fallback}</> : MinimalFallback}
      onReset={onReset}
      onError={(error, info) => {
        console.error('Component Error:', error, info.componentStack);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

// =============================================================================
// Re-exports for convenience
// =============================================================================

export { useErrorBoundary } from 'react-error-boundary';
export type { FallbackProps };
