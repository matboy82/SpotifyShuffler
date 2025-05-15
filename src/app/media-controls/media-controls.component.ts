import { Component, effect, input } from '@angular/core';
import { MaterialModule } from '../material/material.module';
import { PlaylistItem } from '../interfaces/playlist-item';
import { Device } from '../interfaces/device';
import { PlaybackService } from '../playback.service';

@Component({
  selector: 'app-media-controls',
  standalone: true,
  imports: [MaterialModule],
  templateUrl: './media-controls.component.html',
  styleUrl: './media-controls.component.scss'
})
export class MediaControlsComponent {
  currentPlaylistInfo = input<PlaylistItem>();
  currentDevice = input<Device>();
  
  // Use the playing signal from the PlaybackService
  playing = this.playbackService.playing;

  constructor(private playbackService: PlaybackService) {
    // When device input changes, update the playback service
    effect(() => {
      const device = this.currentDevice();
      if (device) {
        this.playbackService.setDevice(device);
      }
    });
  }

  playerInit() {
    void this.playbackService.playerInit();
  }

  playTracks() {
    void this.playbackService.playTracks();
  }

  pauseTrack() {
    void this.playbackService.pauseTrack();
  }

  nextTrack() {
    void this.playbackService.nextTrack();
  }

  previousTrack() {
    void this.playbackService.previousTrack();
  }
}
