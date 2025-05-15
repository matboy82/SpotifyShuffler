import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, Input, input, OnInit } from '@angular/core';
import { PlaylistService } from '../playlist.service';
import { DeviceService } from '../device.service';
import { PlayingInfoComponent } from '../playing-info/playing-info.component';
import { MediaControlsComponent } from '../media-controls/media-controls.component';
import { MaterialModule } from '../material/material.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SpotifyService } from '../spotify.service';
import { PlaylistItem } from '../interfaces/playlist-item';
import { Device } from '../interfaces/device';
import type { PlaybackState } from '@spotify/web-api-ts-sdk';
import { TrackListComponent } from "../track-list/track-list.component";
import { WebPlaybackService } from '../services/web-playback.service';

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

  currentDevice!: Device;
  playing!: boolean;
  private sdk = inject(SpotifyService).getSdk();
  playlistService = inject(PlaylistService);
  deviceService = inject(DeviceService);
  
  private pollInterval: number | null = null;
  private destroyRef = inject(DestroyRef);
  private webPlayback = inject(WebPlaybackService);

  constructor() {
    // Load tracks when playlist ID changes and set up polling
    effect(() => {
      if (this.playlistId()) {
        this.playlistService.getPlaylistTracks(this.playlistId());
      }
    });

    // Get active device and set up state polling
    this.deviceService.getDevices().subscribe((devices) => {
      if (devices.length > 0) {
        this.currentDevice = devices[0];
        this.setupStatePolling();
      }
    });

    // Set up effect to update playing state based on WebPlaybackService
    effect(() => {
      this.playing = this.webPlayback.getIsPlaying()();
    });

    // Clean up on destroy
    this.destroyRef.onDestroy(() => {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
      }
    });
  }
  
  private setupStatePolling() {
    // Clear any existing interval
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    // Initial state update
    this.updatePlaybackState();

    // Set up polling (though WebPlaybackService already has its own state management)
    this.pollInterval = window.setInterval(() => {
      this.updatePlaybackState();
    }, 1000);
  }

  private updatePlaybackState() {
    try {
      // Get the current playing state from WebPlaybackService
      this.playing = this.webPlayback.getIsPlaying()();
      
      // Note: The WebPlaybackService doesn't provide full track info in its state
      // So we'll keep using the current track from the playlist service
      // If you need more detailed track info, you can extend the WebPlaybackService
      // to provide that information
    } catch (error) {
      console.error('Error updating playback state:', error);
    }
  }

  playerInit() {
    const songs = this.playlistService.songs();
    if (songs && songs.length > 0) {
      this.playlistService.shuffleTracks(songs);
    } else {
      console.warn('No songs available to shuffle');
    }
  }



  async playTracks(): Promise<void> {
    try {
      // Get latest songs from playlist service
      let songs = this.playlistService.songs();
      if (!songs || songs.length === 0) {
        console.warn('No songs available to play');
        return;
      }

      // If we haven't shuffled yet, shuffle the tracks
      if (!this.playlistService.isShuffled()) {
        songs = this.playlistService.shuffleTracks([...songs]);
      }

      // Try WebPlaybackService first
      try {
        // Check if WebPlaybackService is ready
        if (!this.webPlayback.getIsReady()()) {
          console.warn('Web Playback Service is not ready. Waiting for device...');
          // Wait for the device to be ready (max 10 seconds)
          const maxAttempts = 20;
          let attempts = 0;
          
          while (!this.webPlayback.getIsReady()() && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
          }
        }

        // If WebPlaybackService is ready, use it
        if (this.webPlayback.getIsReady()()) {
          await this.webPlayback.playTracks(songs);
          this.playing = true;
          return;
        }
      } catch (webPlaybackError) {
        console.warn('Web Playback Service error, falling back to Web API', webPlaybackError);
      }

      // Fallback to Web API if WebPlaybackService is not available
      if (!this.currentDevice) {
        throw new Error('No active device found');
      }

      const trackUris = songs.map(song => song.track.uri);
      
      // Use the Web API directly as a fallback
      await this.sdk.player.startResumePlayback(
        this.currentDevice.id as string,
        undefined,
        trackUris,
        undefined,
        0
      );
      
      this.playing = true;
    } catch (error) {
      console.error('Error playing tracks:', error);
      this.playing = false;
    }
  }

  async togglePlayback(): Promise<void> {
    try {
      // Try WebPlaybackService first
      try {
        if (this.playing) {
          await this.webPlayback.pause();
        } else {
          await this.webPlayback.resume();
        }
        this.playing = !this.playing;
        return;
      } catch (webPlaybackError) {
        console.warn('Web Playback Service error, falling back to Web API', webPlaybackError);
      }

      // Fallback to Web API
      if (!this.currentDevice) {
        throw new Error('No active device found');
      }

      if (this.playing) {
        await this.sdk.player.pausePlayback(this.currentDevice.id as string);
      } else {
        await this.sdk.player.startResumePlayback(this.currentDevice.id as string);
      }
      this.playing = !this.playing;
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  }

  async pauseTrack(): Promise<void> {
    try {
      // Try WebPlaybackService first
      try {
        await this.webPlayback.pause();
        this.playing = false;
        return;
      } catch (webPlaybackError) {
        console.warn('Web Playback Service error, falling back to Web API', webPlaybackError);
      }

      // Fallback to Web API
      if (!this.currentDevice) {
        throw new Error('No active device found');
      }

      await this.sdk.player.pausePlayback(this.currentDevice.id as string);
      this.playing = false;
    } catch (error) {
      console.error('Error pausing track:', error);
    }
  }

  async nextTrack(): Promise<void> {
    try {
      // Try WebPlaybackService first
      try {
        await this.webPlayback.nextTrack();
        this.playing = true;
        return;
      } catch (webPlaybackError) {
        console.warn('Web Playback Service error, falling back to Web API', webPlaybackError);
      }

      // Fallback to Web API
      if (!this.currentDevice) {
        throw new Error('No active device found');
      }

      await this.sdk.player.skipToNext(this.currentDevice.id as string);
      this.playing = true;
    } catch (error) {
      console.error('Error skipping to next track:', error);
    }
  }

  async previousTrack(): Promise<void> {
    try {
      // Try WebPlaybackService first
      try {
        await this.webPlayback.previousTrack();
        this.playing = true;
        return;
      } catch (webPlaybackError) {
        console.warn('Web Playback Service error, falling back to Web API', webPlaybackError);
      }

      // Fallback to Web API
      if (!this.currentDevice) {
        throw new Error('No active device found');
      }

      await this.sdk.player.skipToPrevious(this.currentDevice.id as string);
      this.playing = true;
    } catch (error) {
      console.error('Error skipping to previous track:', error);
    }
  }
}