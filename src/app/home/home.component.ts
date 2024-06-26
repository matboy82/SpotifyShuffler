import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { PlaylistItem } from '../interfaces/playlist-item';
import { PlaylistService } from '../playlist.service';
import { SpotifyService } from '../spotify.service';
import { RouterOutlet } from '@angular/router';
import { MaterialModule } from '../material/material.module';
import { PlaylistCardComponent } from '../playlist-card/playlist-card.component';
import { SearchPlaylistsComponent } from '../search-playlists/search-playlists.component';
import { SpotifyPlayerComponent } from '../spotify-player/spotify-player.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, MaterialModule, PlaylistCardComponent, SearchPlaylistsComponent, SpotifyPlayerComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit{
  title = 'Spotify Shuffler';
  subtext = 'Shuffle your Spotify playlists with ease';
  sdk!: SpotifyApi;
  playlistId!: string;
  currentPlaylistInfo!: PlaylistItem;

  constructor(private spotifyService: SpotifyService, private playlistService: PlaylistService) {
  }

  /**
   * Getters and setters required to get playlists from PlaylistService signal()
   */
  get playlists() {
    return this.playlistService.lists();
  }

  set playlists(playlists: PlaylistItem[]) {
    this.playlistService.lists.set(playlists);
  }

   ngOnInit(): void {    
    this.sdk = this.spotifyService.getSdk();
   }

   getPlaylist() {
    this.sdk.playlists.getUsersPlaylists('r3b00tz').then((data: any) => {
      this.playlists = data.items;
    });   
  }

  selectedPlaylist(playlistId: string) {
    this.playlistId = playlistId;

    this.currentPlaylistInfo = this.playlists.find((p) => p.id === playlistId)!;
    this.playlistService.playlist.set(this.currentPlaylistInfo);
    
  }
}
