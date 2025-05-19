import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorDialogComponent, ErrorDialogData } from '../error-dialog/error-dialog.component';

export type NotificationType = 'error' | 'warning' | 'info' | 'success';

export interface NotificationOptions {
  type?: NotificationType;
  duration?: number;
  action?: string;
  details?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  /**
   * Show a notification using SnackBar (for non-critical messages)
   * @param message The message to display
   * @param options Notification options
   */
  show(message: string, options: NotificationOptions = {}) {
    const { type = 'info', duration = 5000, action } = options;
    
    this.snackBar.open(message, action || 'Close', {
      duration,
      panelClass: [`notification-${type}`],
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });
  }

  /**
   * Show an error dialog (for critical errors that need user attention)
   * @param title Dialog title
   * @param message Error message
   * @param details Additional error details (shown in expandable section)
   */
  showError(title: string, message: string, details?: string) {
    this.dialog.open(ErrorDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { title, message, details } as ErrorDialogData,
      disableClose: false,
      autoFocus: false
    });
  }

  // Convenience methods for different notification types
  error(message: string, details?: string) {
    this.showError('Error', message, details);
  }

  warning(message: string) {
    this.show(message, { type: 'warning' });
  }

  info(message: string) {
    this.show(message, { type: 'info' });
  }

  success(message: string) {
    this.show(message, { type: 'success' });
  }
}
