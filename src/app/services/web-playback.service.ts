import { Injectable, signal, effect, inject, DestroyRef } from '@angular/core';
import { PlaylistedTrack } from '@spotify/web-api-ts-sdk';
import { SpotifyService } from '../spotify.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Type definitions for Spotify Web Playback SDK
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    spotifyPlayerReady: () => void;
    Spotify: {
      Player: new (options: SpotifyPlayerOptions) => SpotifyPlayer;
    };
  }
}

interface SpotifyPlayerOptions {
  name: string;
  getOAuthToken: (cb: (token: string) => void) => void;
  volume?: number;
}

interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  addListener(event: string, callback: (state: any) => void): void;
  removeListener(event: string, callback?: (state: any) => void): void;
  getCurrentState(): Promise<any>;
  getVolume(): Promise<number>;
  nextTrack(): Promise<void>;
  pause(): Promise<void>;
  previousTrack(): Promise<void>;
  resume(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  togglePlay(): Promise<void>;
  _options: SpotifyPlayerOptions;
}

@Injectable({
  providedIn: 'root'
})
export class WebPlaybackService {
  private player: SpotifyPlayer | null = null;
  private readonly isReady = signal<boolean>(false);
  private readonly isPlaying = signal<boolean>(false);
  private readonly deviceId = signal<string>('');
  private readonly playerState = signal<'idle' | 'ready' | 'playing' | 'paused' | 'error'>('idle');
  private currentTrack = signal<PlaylistedTrack | null>(null);
  private spotifyService = inject(SpotifyService);
  private destroyRef = inject(DestroyRef);
  private accessToken: string | null = null;

  constructor() {
    // Get the access token from the Spotify service
    this.accessToken = localStorage.getItem('spotify_access_token');
    
    // Initialize the player when the service is created
    this.initializePlayer();
  }

  private async initializePlayer(): Promise<void> {
    if (this.player) {
      return;
    }

    try {
      // Ensure we have a valid token
      const token = await this.ensureValidToken();
      if (!token) {
        console.error('No valid access token available');
        return;
      }
      this.accessToken = token;

      // Set up the global callback
      window.spotifyPlayerReady = () => {
        console.log('Spotify Web Playback SDK ready - initializing player');
        if (this.accessToken) {
          this.setupPlayer(this.accessToken);
        }
      };

      // If SDK is already loaded and ready, trigger the callback
      if (window.Spotify?.Player) {
        console.log('Spotify Web Playback SDK already loaded');
        window.spotifyPlayerReady();
      } else {
        console.log('Waiting for Spotify Web Playback SDK to load...');
      }
    } catch (error) {
      console.error('Error initializing player:', error);
    }
  }

  private async ensureValidToken(): Promise<string | null> {
    // First try to get the current token
    const currentToken = this.spotifyService.getAccessToken();
    const expiresAt = this.spotifyService.getTokenExpiration();

    // If we have a valid token, return it
    if (currentToken && expiresAt && expiresAt > Date.now() + 60000) { // 1 minute buffer
      return currentToken;
    }

    try {
      // Token expired or will expire soon, try to refresh
      console.log('Access token expired or about to expire, refreshing...');
      const newToken = await this.spotifyService.refreshAccessToken();
      
      if (!newToken) {
        console.error('Failed to refresh access token');
        return null;
      }

      return newToken;
    } catch (error) {
      console.error('Error ensuring valid token:', error);
      return null;
    }
  }

  private setupPlayer(token: string): void {
    if (!window.Spotify) {
      throw new Error('Spotify Web Playback SDK not loaded');
    }

    try {
      const player = new window.Spotify.Player({
        name: 'Spotify Shuffler',
        getOAuthToken: async (cb: (t: string) => void) => {
          const newToken = await this.ensureValidToken();
          if (newToken) {
            cb(newToken);
          }
        },
        volume: 0.5
      });

      // Player ready
      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        this.deviceId.set(device_id);
        this.playerState.set('ready');
      });

      // Player state changed
      player.addListener('player_state_changed', (state) => {
        this.currentTrack.set(state?.track_window?.current_track);
        this.isPlaying.set(!state?.paused);
        this.playerState.set('playing');
      });

      // Handle initialization errors
      player.addListener('initialization_error', ({ message }) => {
        console.error('Failed to initialize player:', message);
        this.playerState.set('error');
      });

      // Handle authentication errors
      player.addListener('authentication_error', async ({ message }) => {
        console.error('Authentication error:', message);
        this.playerState.set('error');
        // Try to refresh the token
        this.accessToken = await this.spotifyService.refreshAccessToken();
        if (this.accessToken) {
          this.initializePlayer();
        }
      });

      // Handle account errors
      player.addListener('account_error', ({ message }) => {
        console.error('Account error:', message);
        this.playerState.set('error');
      });

      // Connect to the player
      player.connect().then(
        (connected: boolean) => {
          if (connected) {
            this.player = player;
            console.log('Spotify Player connected');
          } else {
            throw new Error('Failed to connect to Spotify Player');
          }
        },
        (error: any) => {
          console.error('Error connecting to Spotify Player:', error);
          this.playerState.set('error');
        }
      );
    } catch (error) {
      console.error('Error initializing Web Playback SDK:', error);
    }
  }

  async playTracks(tracks: PlaylistedTrack[], offset = 0): Promise<void> {
    if (!tracks?.length) {
      console.error('No tracks provided to play');
      return;
    }

    // Ensure we have a valid token
    const token = await this.ensureValidToken();
    if (!token) {
      console.error('No valid access token available for playback');
      return;
    }

    // If Web Playback isn't ready, fall back to Web API
    if (!this.isReady() || !this.deviceId()) {
      console.warn('Web Playback not ready, falling back to Web API');
      try {
        await this.spotifyService.playTracks(tracks.map(t => t.track.uri), offset);
      } catch (error) {
        console.error('Error playing tracks via Web API:', error);
      }
      return;
    }

    const trackUris = tracks.map(track => track.track.uri);
    
    if (!token) {
      throw new Error('No valid access token available');
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId()}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            uris: trackUris,
            offset: { position: offset },
            position_ms: 0
          }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to start playback: ${error}`);
      }
    } catch (error) {
      console.error('Error playing tracks:', error);
      throw error;
    }
  }

async pause(): Promise<void> {
  if (!this.isReady() || !this.player) return;
  try {
    await this.player.pause();
    this.isPlaying.set(false);
  } catch (error) {
    console.error('Error pausing playback:', error);
    throw error;
  }
}

async resume(): Promise<void> {
  if (!this.isReady() || !this.player) return;
  try {
    await this.player.resume();
    this.isPlaying.set(true);
  } catch (error) {
    console.error('Error resuming playback:', error);
    throw error;
  }
}

async nextTrack(): Promise<void> {
  if (!this.isReady() || !this.player) return;
  try {
    await this.player.nextTrack();
  } catch (error) {
    console.error('Error skipping to next track:', error);
    throw error;
  }
}

async previousTrack(): Promise<void> {
  if (!this.isReady() || !this.player) return;
  try {
    await this.player.previousTrack();
  } catch (error) {
    console.error('Error going to previous track:', error);
    throw error;
  }
}

getIsPlaying() {
  return this.isPlaying.asReadonly();
}

getCurrentTrack() {
  return this.currentTrack.asReadonly();
}

getIsReady() {
  return this.isReady.asReadonly();
}

getDeviceId() {
  return this.deviceId.asReadonly();
}
}
