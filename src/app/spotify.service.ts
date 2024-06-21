import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SpotifyApi, AuthorizationCodeWithPKCEStrategy } from '@spotify/web-api-ts-sdk';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  private clientId = '7ca110f3b9934a4e9889f3a85fef87b3';
  private clientSecret = 'add2833f0c8b47918f1f38d250353dea';
  sdk!: SpotifyApi;
  
  constructor(private http: HttpClient) { 
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

  authenticate() {
    this.sdk.authenticate().then((data) => {
      localStorage.setItem('access_token', data.accessToken.toString());
    });
  }

  getSdk(): SpotifyApi {
    return this.sdk;
  }
}
