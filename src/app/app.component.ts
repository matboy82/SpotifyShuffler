import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SpotifyService } from './spotify.service';
import { PlaylistService } from './playlist.service';
import { AuthorizationCodeWithPKCEStrategy, SpotifyApi } from '@spotify/web-api-ts-sdk';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  providers: [SpotifyService, PlaylistService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  title = 'SpotifyShuffler';
  sdk!: SpotifyApi;

  constructor(private router: Router, private spotifyService: SpotifyService, private playlistService: PlaylistService) {

    const scope = [
      'user-read-private',
      'user-read-email',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-top-read'
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
      console.log(data);
      localStorage.setItem('access_token', data.accessToken.toString()); // data.accessToken
    });
   }

   getPlaylist() {
    this.sdk.currentUser.playlists.playlists().then((playlists: any) => {
      console.log(playlists);
    });   
  }
}
