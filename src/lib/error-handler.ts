import { toast } from 'sonner';

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: string;
}

export function handleError(error: unknown, fallbackMessage = 'An unexpected error occurred'): ErrorResponse {
  console.error('Error:', error);
  
  let errorMessage = fallbackMessage;
  let errorCode = 'UNKNOWN_ERROR';
  let errorDetails = '';

  if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error.stack || '';
  } else if (typeof error === 'object' && error !== null) {
    const err = error as any;
    if (err.message) errorMessage = err.message;
    if (err.code) errorCode = err.code;
    if (err.details) errorDetails = err.details;
  }

  // Show toast notification
  toast.error(errorMessage);

  return {
    message: errorMessage,
    code: errorCode,
    details: errorDetails
  };
}

export function handleSuccess(message: string) {
  toast.success(message);
} 