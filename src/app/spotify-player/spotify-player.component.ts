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
    effect(() => {
      if (this.playlistId()) {
        this.playlistService.getPlaylistTracks(this.playlistId());
      }
    });

    // Get active device and update playback service
    this.deviceService.getDevices().subscribe((devices) => {
      if (devices.length > 0) {
        this.currentDevice = devices[0];
        this.playbackService.setDevice(this.currentDevice);
      }
    });

    // Clean up on destroy
    this.destroyRef.onDestroy(() => {
      this.playbackService.stopStatePolling();
    });
  }

  playerInit() {
    this.playbackService.playerInit();
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