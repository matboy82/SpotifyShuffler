import { TestBed } from '@angular/core/testing';
import { GlobalErrorHandlerService } from './global-error-handler.service';
import { NotificationService } from './notification.service';

describe('GlobalErrorHandlerService', () => {
  let service: GlobalErrorHandlerService;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    // Create spy for notification service
    mockNotificationService = jasmine.createSpyObj('NotificationService', ['error']);

    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandlerService,
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    });

    service = TestBed.inject(GlobalErrorHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('handleError', () => {
    it('should log error to console', () => {
      // Arrange
      const error = new Error('Test error');
      spyOn(console, 'error');
      
      // Act
      service.handleError(error);
      
      // Assert
      expect(console.error).toHaveBeenCalledWith('Global error handler caught:', error);
    });

    it('should show notification for non-common errors', () => {
      // Arrange
      const error = new Error('Critical system error');
      
      // Act
      service.handleError(error);
      
      // Assert
      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'An error occurred',
        'Critical system error'
      );
    });

    it('should not show notification for common errors', () => {
      // Arrange
      const commonErrors = [
        new Error('No device selected'),
        new Error('No playlist selected'),
        new Error('No tracks available')
      ];
      
      // Act & Assert
      commonErrors.forEach(error => {
        service.handleError(error);
        expect(mockNotificationService.error).not.toHaveBeenCalled();
      });
    });
  });

  describe('getErrorMessage', () => {
    it('should return error message for Error instance', () => {
      // Arrange
      const error = new Error('Test error message');
      
      // Act
      const result = (service as any).getErrorMessage(error);
      
      // Assert
      expect(result).toBe('Test error message');
    });

    it('should handle TimeoutError', () => {
      // Arrange
      const error = { name: 'TimeoutError', message: 'Request timed out' };
      
      // Act
      const result = (service as any).getErrorMessage(error);
      
      // Assert
      expect(result).toContain('The request timed out');
    });

    it('should handle string errors', () => {
      // Arrange
      const error = 'Simple error string';
      
      // Act
      const result = (service as any).getErrorMessage(error);
      
      // Assert
      expect(result).toBe('Simple error string');
    });

    it('should handle unknown error types', () => {
      // Arrange
      const error = { someCustomProperty: 'value' };
      
      // Act
      const result = (service as any).getErrorMessage(error);
      
      // Assert
      expect(result).toBe('An unknown error occurred');
    });
  });
});
