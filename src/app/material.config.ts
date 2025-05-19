import { provideNativeDateAdapter } from '@angular/material/core';
import { provideAnimations } from '@angular/platform-browser/animations';

export const materialProviders = [
  provideAnimations(),
  provideNativeDateAdapter(),
];
