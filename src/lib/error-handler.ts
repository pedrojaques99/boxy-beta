import { toast } from 'sonner';

interface ErrorResponse {
  error: string;
  code?: string;
  details?: string;
}

export function handleError(error: unknown, fallbackMessage = 'An unexpected error occurred'): ErrorResponse {
  console.error('Error:', error);
  
  let errorMessage = fallbackMessage;
  let errorCode = 'UNKNOWN_ERROR';
  let errorDetails: string | undefined;

  if (error instanceof Error) {
    errorMessage = error.message;
    errorCode = error.name;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    errorMessage = String(err.message || fallbackMessage);
    errorCode = String(err.code || 'UNKNOWN_ERROR');
    errorDetails = err.details ? String(err.details) : undefined;
  }

  // Show toast notification
  toast.error(errorMessage);

  return {
    error: errorMessage,
    code: errorCode,
    details: errorDetails
  };
}

export function handleSuccess(message: string) {
  toast.success(message);
} 