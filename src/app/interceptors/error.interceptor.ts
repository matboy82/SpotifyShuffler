import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private notification = inject(NotificationService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';
        
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Server-side error
          errorMessage = this.getServerErrorMessage(error);
        }
        
        // Show error notification
        this.notification.error('Request failed', errorMessage);
        
        // Re-throw the error to be handled by the component if needed
        return throwError(() => error);
      })
    );
  }

  private getServerErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 400:
        return 'Bad Request: The request was invalid.';
      case 401:
        return 'Unauthorized: Please log in again.';
      case 403:
        return 'Forbidden: You do not have permission to access this resource.';
      case 404:
        return 'Not Found: The requested resource was not found.';
      case 429:
        return 'Too Many Requests: Please wait before making another request.';
      case 500:
        return 'Server Error: Something went wrong on our end.';
      case 503:
        return 'Service Unavailable: The service is currently unavailable.';
      default:
        return error.message || 'An unexpected error occurred';
    }
  }
}
