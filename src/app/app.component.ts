import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SpotifyService } from './spotify.service';
import { PlaylistService } from './playlist.service';
import { AuthorizationCodeWithPKCEStrategy, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { MaterialModule } from './material/material.module';
import { PlaylistItem } from './interfaces/playlist-item';
import { Playlist } from './interfaces/playlist';
import { PlaylistCardComponent } from './playlist-card/playlist-card.component';
import { SearchPlaylistsComponent } from './search-playlists/search-playlists.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MaterialModule, PlaylistCardComponent, SearchPlaylistsComponent],
  providers: [SpotifyService, PlaylistService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppComponent implements OnInit{
  title = 'Spotify Shuffler';
  subtext = 'Shuffle your Spotify playlists with ease';
  sdk!: SpotifyApi;
  playlists: PlaylistItem[] = [];

  constructor(private router: Router, private spotifyService: SpotifyService, private playlistService: PlaylistService) {

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
   ngOnInit(): void {
    this.sdk.authenticate().then((data) => {
      localStorage.setItem('access_token', data.accessToken.toString()); // data.accessToken
    });

    
   }

   getPlaylist() {
    this.sdk.playlists.getUsersPlaylists('r3b00tz').then((data: any) => {
      this.playlists = data.items;
      console.log(this.playlists);
    });   
  }
}
