import { ChangeDetectionStrategy, Component, inject, input, OnInit, Output, EventEmitter } from '@angular/core';
import { SearchPlaylistsComponent } from "../search-playlists/search-playlists.component";
import { SpotifyPlayerComponent } from "../spotify-player/spotify-player.component";
import { PlaylistItem } from '../interfaces/playlist-item';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { SpotifyService } from '../spotify.service';
import { MaterialModule } from '../material/material.module';

@Component({
  selector: 'app-hero',
  imports: [SearchPlaylistsComponent, SpotifyPlayerComponent, MaterialModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroComponent implements OnInit  {
  title = input('');
  subtext = input('');
  sdk!: SpotifyApi;
  playlistId!: string;
  currentPlaylistInfo!: PlaylistItem;
  playlists: PlaylistItem[] = [];
  spotifyService = inject(SpotifyService);
  @Output() playlistsLoaded = new EventEmitter<PlaylistItem[]>();

  ngOnInit(): void {
    this.sdk = this.spotifyService.getSdk();
  }

  getPlaylist() {
    this.sdk.playlists.getUsersPlaylists('r3b00tz').then((data: any) => {
      this.playlists = data.items;
      this.playlistsLoaded.emit(this.playlists);
    });
  }
}
