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
      // Filter out any playlists that don't have required properties
      const validPlaylists = data.items.filter((playlist: any) => 
        playlist?.id && 
        playlist?.name && 
        Array.isArray(playlist.images) && 
        playlist.images.length > 0
      );
      
      console.log('Filtered playlists:', validPlaylists.length, 'of', data.items.length);
      this.playlists = validPlaylists;
    }).catch(error => {
      console.error('Error loading playlists:', error);
      this.playlists = [];
    });   
  }

  async selectedPlaylist(playlistId: string) {
    if (!playlistId) {
      console.warn('No playlist ID provided');
      return;
    }
    
    this.playlistId = playlistId;

    try {
      // Find and set the current playlist
      this.currentPlaylistInfo = this.playlists.find((p) => p.id === playlistId)!;
      if (!this.currentPlaylistInfo) {
        console.error('Playlist not found in local state');
        return;
      }
      
      // Update the playlist service with the selected playlist
      this.playlistService.playlist.set(this.currentPlaylistInfo);
      
      // Load tracks using the playlist service
      const tracks = await this.playlistService.getPlaylistTracks(playlistId);
      
      if (tracks && tracks.length > 0) {
        // Update the playlist info with the loaded tracks
        this.currentPlaylistInfo = {
          ...this.currentPlaylistInfo,
          tracks: {
            href: `spotify:playlist:${playlistId}`,
            items: tracks as any, // Cast to any to match the expected type
            total: tracks.length
          }
        };
        
        // Update the playlist in the service
        this.playlistService.playlist.set(this.currentPlaylistInfo);
        
        // If we have a device, we can start playback
        if (this.currentDevice()) {
          await this.playbackService.playTrack();
        }
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
