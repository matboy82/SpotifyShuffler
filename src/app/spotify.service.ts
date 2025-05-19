import { Injectable, inject } from '@angular/core';
import { SpotifyApi, AuthorizationCodeWithPKCEStrategy, type AccessToken } from '@spotify/web-api-ts-sdk';
import { NotificationService } from './services/notification.service';

@Injectable({
  providedIn: 'root'
})
/**
 * Sets up the Spotify SDK and returns the instance.
 */
@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  private clientId = '7ca110f3b9934a4e9889f3a85fef87b3';
  private clientSecret = 'add2833f0c8b47918f1f38d250353dea';
  sdk!: SpotifyApi;
  private notification = inject(NotificationService);
  
  constructor() { 
    const scope = [
      'user-read-private',
      'user-read-email',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-top-read',
      'user-read-recently-played',
      'user-follow-read',
      'user-follow-modify',
      'streaming',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-modify',
      'user-library-read',
      'user-read-playback-position',
      'user-read-currently-playing',
      'user-read-recently-played',
      'user-top-read',
      'user-read-playback-state',
      'user-modify-playback-state'
    ];
  
    const strategy = new AuthorizationCodeWithPKCEStrategy(
      "7ca110f3b9934a4e9889f3a85fef87b3",
      "http://localhost:4200",
      scope
    );
  
    this.sdk = new SpotifyApi(strategy);
  }

  async authenticate(): Promise<boolean> {
    try {
      const data = await this.sdk.authenticate();
      if (data && data.authenticated) {
        // The SDK handles token storage internally
        this.notification.success('Successfully connected to Spotify');
        return true;
      }
      this.notification.error('Authentication failed', 'Could not authenticate with Spotify');
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to authenticate with Spotify';
      this.notification.error('Authentication failed', errorMessage);
      return false;
    }
  }

  getSdk(): SpotifyApi {
    if (!this.sdk) {
      this.notification.error('Spotify SDK not initialized', 'Please try refreshing the page');
      throw new Error('Spotify SDK not initialized');
    }
    return this.sdk;
  }
}
