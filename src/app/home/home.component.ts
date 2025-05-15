import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { PlaylistItem } from '../interfaces/playlist-item';
import { PlaylistService } from '../playlist.service';
import { SpotifyService } from '../spotify.service';
import { PlaybackService } from '../playback.service';

import { MaterialModule } from '../material/material.module';
import { PlaylistCardComponent } from '../playlist-card/playlist-card.component';
import { SearchPlaylistsComponent } from '../search-playlists/search-playlists.component';
import { MediaControlsComponent } from '../media-controls/media-controls.component';
import { HeroComponent } from "../hero/hero.component";
import { PlayingInfoComponent } from "../playing-info/playing-info.component";

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [MaterialModule, PlaylistCardComponent, HeroComponent, PlayingInfoComponent, MediaControlsComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  title = 'Spotify Shuffler';
  subtext = 'Shuffle your Spotify playlists with ease';
  sdk!: SpotifyApi;
  playlistId!: string;
  currentPlaylistInfo!: PlaylistItem;

  private spotifyService = inject(SpotifyService);
  private playlistService = inject(PlaylistService);
  private playbackService = inject(PlaybackService);

  readonly currentDevice = computed(() => this.playbackService.currentDevice());
  readonly playing = computed(() => this.playbackService.playing());

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

  async selectedPlaylist(playlistId: string) {
    this.playlistId = playlistId;

    // Find and set the current playlist
    this.currentPlaylistInfo = this.playlists.find((p) => p.id === playlistId)!;
    this.playlistService.playlist.set(this.currentPlaylistInfo);

    try {
      // Load all tracks
      const tracks = await this.sdk.playlists.getPlaylistItems(playlistId);
      if (tracks.items.length > 0) {
        this.currentPlaylistInfo = {
          ...this.currentPlaylistInfo,
          tracks: {
            href: tracks.href,
            items: tracks.items,
            total: tracks.total
          }
        };
        this.playlistService.playlist.set(this.currentPlaylistInfo);
      }
    } catch (error) {
      console.error('Error loading playlist tracks:', error);
    }
  }

  onPlaylistsLoaded(playlists: PlaylistItem[]) {
    this.playlists = playlists;
  }

  trackByPlaylistId(index: number, playlist: PlaylistItem): string {
    return playlist?.id || index.toString();
  }
}
