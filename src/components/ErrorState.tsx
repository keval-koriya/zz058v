import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  error: Error;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 text-center max-w-md">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="h-7 w-7 text-red-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Error Loading Data
        </h3>
        <p className="mt-2 text-sm text-gray-600">{error.message}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
