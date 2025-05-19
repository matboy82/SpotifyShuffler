import { TestBed } from '@angular/core/testing';
import { NotificationService, NotificationType } from './notification.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ErrorDialogComponent>>;

  beforeEach(() => {
    // Create spies
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    // Setup dialog to return our mock dialog ref
    mockDialog.open.and.returnValue(mockDialogRef);

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    });

    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('show', () => {
    it('should show a snackbar with default options', () => {
      // Arrange
      const message = 'Test message';
      
      // Act
      service.show(message);
      
      // Assert
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        message,
        'Close',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: ['notification-info'],
          horizontalPosition: 'right',
          verticalPosition: 'bottom'
        })
      );
    });

    it('should show a snackbar with custom options', () => {
      // Arrange
      const message = 'Test error';
      const options: { type: NotificationType, duration: number, action: string } = {
        type: 'error',
        duration: 10000,
        action: 'Dismiss'
      };
      
      // Act
      service.show(message, options);
      
      // Assert
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        message,
        options.action,
        jasmine.objectContaining({
          duration: options.duration,
          panelClass: ['notification-error']
        })
      );
    });
  });

  describe('showError', () => {
    it('should open an error dialog with provided details', () => {
      // Arrange
      const title = 'Error Title';
      const message = 'Error message';
      const details = 'Error details';
      
      // Act
      service.showError(title, message, details);
      
      // Assert
      expect(mockDialog.open).toHaveBeenCalledWith(
        ErrorDialogComponent,
        jasmine.objectContaining({
          width: '500px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          data: { title, message, details },
          disableClose: false,
          autoFocus: false
        })
      );
    });

    it('should open an error dialog without details if not provided', () => {
      // Arrange
      const title = 'Error Title';
      const message = 'Error message';
      
      // Act
      service.showError(title, message);
      
      // Assert
      expect(mockDialog.open).toHaveBeenCalledWith(
        ErrorDialogComponent,
        jasmine.objectContaining({
          data: jasmine.objectContaining({
            title,
            message,
            details: undefined
          })
        })
      );
    });
  });

  describe('convenience methods', () => {
    it('should call show with error type', () => {
      // Arrange
      const message = 'Error message';
      spyOn(service, 'show');
      
      // Act
      service.error(message);
      
      // Assert
      expect(service.show).toHaveBeenCalledWith(
        message,
        jasmine.objectContaining({ type: 'error' })
      );
    });

    it('should call show with warning type', () => {
      // Arrange
      const message = 'Warning message';
      spyOn(service, 'show');
      
      // Act
      service.warning(message);
      
      // Assert
      expect(service.show).toHaveBeenCalledWith(
        message,
        jasmine.objectContaining({ type: 'warning' })
      );
    });

    it('should call show with success type', () => {
      // Arrange
      const message = 'Success message';
      spyOn(service, 'show');
      
      // Act
      service.success(message);
      
      // Assert
      expect(service.show).toHaveBeenCalledWith(
        message,
        jasmine.objectContaining({ type: 'success' })
      );
    });
  });
});
