import { ErrorHandler, Injectable, inject } from '@angular/core';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandlerService implements ErrorHandler {
  private notification = inject(NotificationService);

  handleError(error: unknown): void {
    // Don't show notification for common errors that we handle elsewhere
    if (this.isCommonError(error)) {
      return;
    }

    // Log the error to the console for debugging
    console.error('Global error handler caught:', error);
    
    // Show a user-friendly error message
    const errorMessage = this.getErrorMessage(error);
    this.notification.error('An error occurred', errorMessage);
  }

  private isCommonError(error: unknown): boolean {
    // Skip common errors that are handled elsewhere
    if (error instanceof Error) {
      const commonErrors = [
        'No device selected',
        'No playlist selected',
        'No tracks available'
      ];
      
      return commonErrors.some(msg => error.message.includes(msg));
    }
    return false;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'TimeoutError') {
        return 'The request timed out. Please check your internet connection and try again.';
      }
      
      // Generic error message for other errors
      return error.message || 'An unexpected error occurred';
    }
    
    // Handle non-Error objects
    if (typeof error === 'string') {
      return error;
    }
    
    return 'An unknown error occurred';
  }
}
