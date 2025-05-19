import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input } from '@angular/core';
import { PlaylistService } from '../playlist.service';
import { DeviceService } from '../device.service';
import { PlayingInfoComponent } from '../playing-info/playing-info.component';
import { MediaControlsComponent } from '../media-controls/media-controls.component';
import { MaterialModule } from '../material/material.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PlaylistItem } from '../interfaces/playlist-item';
import { Device } from '../interfaces/device';
import { TrackListComponent } from "../track-list/track-list.component";
import { PlaybackService } from '../playback.service';

@Component({
  selector: 'app-spotify-player',
  standalone: true,
  imports: [
    MaterialModule,
    PlayingInfoComponent,
    MediaControlsComponent,
    MatIconModule,
    MatButtonModule,
    TrackListComponent
  ],
  templateUrl: './spotify-player.component.html',
  styleUrls: ['./spotify-player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpotifyPlayerComponent {

  playlistId = input<string>('');
  currentPlaylistInfo = input<PlaylistItem>({} as PlaylistItem);

  // Services
  private playbackService = inject(PlaybackService);
  playlistService = inject(PlaylistService);
  private deviceService = inject(DeviceService);
  private destroyRef = inject(DestroyRef);

  // State
  currentDevice!: Device;
  playing!: boolean;
  songs = this.playlistService.songs;

  constructor() {
    // Load tracks when playlist ID changes
    effect(async () => {
      const playlistId = this.playlistId();
      if (playlistId) {
        try {
          await this.playlistService.getPlaylistTracks(playlistId);
          // Auto-shuffle when playlist is loaded
          if (this.playlistService.songs().length > 0) {
            this.playlistService.shuffleTracks(this.playlistService.songs());
            // Auto-play the first track if we have a device
            if (this.currentDevice?.id) {
              await this.playbackService.playTracks();
            }
          }
        } catch (error) {
          console.error('Error loading playlist tracks:', error);
        }
      }
    });

    // Get active device and update playback service
    this.deviceService.getDevices().subscribe((devices) => {
      if (devices.length > 0) {
        // Try to find an active device first
        const activeDevice = devices.find(d => d.is_active);
        if (activeDevice) {
          this.currentDevice = activeDevice;
        } else {
          // Fall back to the first available device
          this.currentDevice = devices[0];
        }
        this.playbackService.setDevice(this.currentDevice);
        
        // If we have songs but not playing, start playback
        if (this.playlistService.songs().length > 0 && !this.playbackService.playing()) {
          this.playbackService.playTracks().catch(console.error);
        }
      }
    });

    // Clean up on destroy
    this.destroyRef.onDestroy(() => {
      this.playbackService.stopStatePolling();
    });
  }

  async playerInit() {
    try {
      await this.playbackService.playerInit();
    } catch (error) {
      console.error('Error initializing player:', error);
    }
  }

  pauseTrack() {
    this.playbackService.pauseTrack();
  }

  nextTrack() {
    this.playbackService.nextTrack();
  }

  previousTrack() {
    this.playbackService.previousTrack();
  }
}