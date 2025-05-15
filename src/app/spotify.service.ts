import { Injectable } from '@angular/core';
import { SpotifyApi, AuthorizationCodeWithPKCEStrategy } from '@spotify/web-api-ts-sdk';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
/**
 * Service for handling Spotify Web API interactions and authentication
 */
export class SpotifyService {
  private readonly clientId = '7ca110f3b9934a4e9889f3a85fef87b3';
  private readonly redirectUri = 'http://localhost:4200/callback';
  private readonly tokenEndpoint = 'https://accounts.spotify.com/api/token';
  
  sdk!: SpotifyApi;
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) { 
    this.initializeSdk();
  }

  private initializeSdk() {
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
      'streaming',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-modify',
      'user-library-read',
      'user-read-playback-position',
      'user-read-currently-playing'
    ];
  
    const strategy = new AuthorizationCodeWithPKCEStrategy(
      this.clientId,
      this.redirectUri,
      scope
    );
  
    this.sdk = new SpotifyApi(strategy);
  }

  async authenticate() {
    try {
      const data = await this.sdk.authenticate();
      if (data?.accessToken) {
        this.setSession({
          access_token: data.accessToken,
          expires_in: 3600,
          refresh_token: localStorage.getItem('spotify_refresh_token') || ''
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  getSdk(): SpotifyApi {
    return this.sdk;
  }

  async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('spotify_refresh_token');
      if (!refreshToken) {
        console.error('No refresh token available');
        this.router.navigate(['/login']);
        return null;
      }

      const response = await this.http.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      ).toPromise();

      const data: any = response;
      const expiresIn = data.expires_in * 1000;
      const expiresAt = Date.now() + expiresIn;

      localStorage.setItem('spotify_access_token', data.access_token);
      localStorage.setItem('token_expires_at', expiresAt.toString());
      
      if (this.sdk) {
        this.sdk = SpotifyApi.withAccessToken(this.clientId, {
          access_token: data.access_token,
          token_type: 'Bearer',
          expires_in: data.expires_in,
          refresh_token: refreshToken
        });
      }

      return data.access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      this.clearTokens();
      this.router.navigate(['/login']);
      return null;
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('spotify_access_token');
  }

  getTokenExpiration(): number | null {
    const expiresAt = localStorage.getItem('token_expires_at');
    return expiresAt ? parseInt(expiresAt, 10) : null;
  }

  private clearTokens(): void {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('token_expires_at');
  }

  private setSession(authResult: any): void {
    const expiresAt = Date.now() + (authResult.expires_in * 1000);
    localStorage.setItem('spotify_access_token', authResult.access_token);
    
    if (authResult.refresh_token) {
      localStorage.setItem('spotify_refresh_token', authResult.refresh_token);
    }
    
    localStorage.setItem('token_expires_at', expiresAt.toString());
  }

  async playTracks(trackUris: string[], offset = 0): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    try {
      await this.http.put('https://api.spotify.com/v1/me/player/play', {
        uris: trackUris,
        offset: { position: offset }
      }, { headers }).toPromise();
    } catch (error) {
      console.error('Error playing tracks:', error);
      throw error;
    }
  }
}