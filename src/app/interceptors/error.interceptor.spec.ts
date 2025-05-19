import { TestBed } from '@angular/core/testing';
import { 
  HttpHandler, 
  HttpRequest, 
  HttpEvent, 
  HttpErrorResponse, 
  HTTP_INTERCEPTORS, 
  HttpResponse,
  HttpHeaders
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

import { ErrorInterceptor } from './error.interceptor';
import { NotificationService } from '../services/notification.service';

describe('ErrorInterceptor', () => {
  let interceptor: ErrorInterceptor;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let mockRequest: HttpRequest<unknown>;
  let mockHandler: jasmine.SpyObj<HttpHandler>;
  const mockErrorResponse = new HttpErrorResponse({
    status: 500,
    statusText: 'Internal Server Error',
    error: { message: 'Test error message' }
  });

  beforeEach(() => {
    // Create spy for NotificationService
    notificationService = jasmine.createSpyObj('NotificationService', ['error']);
    
    // Create a mock HTTP handler
    mockHandler = jasmine.createSpyObj('HttpHandler', ['handle']);
    
    // Create a mock request
    mockRequest = new HttpRequest('GET', '/test');
    
    TestBed.configureTestingModule({
      providers: [
        ErrorInterceptor,
        { provide: NotificationService, useValue: notificationService },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
      ]
    });
    
    interceptor = TestBed.inject(ErrorInterceptor);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should handle client-side errors', (done) => {
    // Arrange
    const clientError = new ErrorEvent('Client error', {
      message: 'Test client error'
    });
    
    mockHandler.handle.and.returnValue(
      throwError(() => new HttpErrorResponse({ error: clientError }))
    );
    
    // Act
    const result$ = interceptor.intercept(mockRequest, mockHandler);
    
    // Assert
    result$.subscribe({
      error: (error) => {
        expect(notificationService.error).toHaveBeenCalledWith(
          'Request failed',
          'Error: Test client error'
        );
        done();
      }
    });
  });

  it('should handle server-side errors', (done) => {
    // Arrange
    mockHandler.handle.and.returnValue(throwError(() => mockErrorResponse));
    
    // Act
    const result$ = interceptor.intercept(mockRequest, mockHandler);
    
    // Assert
    result$.subscribe({
      error: (error) => {
        expect(notificationService.error).toHaveBeenCalledWith(
          'Request failed',
          'Server Error: Something went wrong on our end.'
        );
        done();
      }
    });
  });

  it('should handle 401 Unauthorized errors', (done) => {
    // Arrange
    const unauthorizedError = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized'
    });
    
    mockHandler.handle.and.returnValue(throwError(() => unauthorizedError));
    
    // Act
    const result$ = interceptor.intercept(mockRequest, mockHandler);
    
    // Assert
    result$.subscribe({
      error: (error) => {
        expect(notificationService.error).toHaveBeenCalledWith(
          'Request failed',
          'Unauthorized: Please log in again.'
        );
        done();
      }
    });
  });

  it('should pass through successful responses', (done) => {
    // Arrange
    const mockResponse = new HttpResponse({
      status: 200,
      body: { data: 'test' },
      statusText: 'OK',
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
    
    mockHandler.handle.and.returnValue(of(mockResponse));
    
    // Act
    const result$ = interceptor.intercept(mockRequest, mockHandler);
    
    // Assert
    result$.subscribe({
      next: (response) => {
        expect(response).toEqual(mockResponse);
        expect(notificationService.error).not.toHaveBeenCalled();
        done();
      }
    });
  });
});
